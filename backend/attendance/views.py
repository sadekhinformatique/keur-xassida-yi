from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import IntegrityError
from django.db.models import Count, Q, Sum, Avg
from datetime import date, timedelta
import logging

from .models import Attendance, AttendanceLog
from .serializers import (
    AttendanceSerializer, CheckInSerializer,
    CheckOutSerializer, AttendanceLogSerializer
)
from qrcode_app.models import QRSession
from employees.models import Employee
from schedules.models import EmployeeSchedule

logger = logging.getLogger('attendance')


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related(
        'employee__department'
    ).all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['employee', 'date', 'status']
    search_fields = ['employee__nom', 'employee__prenom', 'employee__matricule']
    ordering_fields = ['date', 'check_in', 'check_out']

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_token = serializer.validated_data['qr_token']

        try:
            qr_session = QRSession.objects.get(
                token=qr_token, is_active=True
            )
        except QRSession.DoesNotExist:
            return Response(
                {'error': 'QR Code invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if qr_session.is_expired():
            return Response(
                {'error': 'QR Code expiré'},
                status=status.HTTP_400_BAD_REQUEST
            )

        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response(
                {'error': 'ID employé requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            employee = Employee.objects.get(id=employee_id, statut='ACTIF')
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employé non trouvé ou inactif'},
                status=status.HTTP_400_BAD_REQUEST
            )

        today = timezone.localdate()

        if Attendance.objects.filter(employee=employee, date=today).exists():
            return Response(
                {'error': 'Pointage déjà effectué aujourd\'hui'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()

        schedule_qs = EmployeeSchedule.objects.filter(
            employee=employee,
            is_active=True,
            start_date__lte=today
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=today)
        ).select_related('schedule')

        status_choice = Attendance.Status.PRESENT
        if schedule_qs.exists():
            schedule = schedule_qs.first().schedule
            scheduled_entry = timezone.datetime.combine(
                today, schedule.entry_time
            )
            tolerance = timedelta(minutes=schedule.tolerance_minutes)
            if now > timezone.make_aware(
                scheduled_entry + tolerance
            ):
                status_choice = Attendance.Status.LATE

        try:
            attendance = Attendance.objects.create(
                employee=employee,
                date=today,
                check_in=now,
                status=status_choice,
                gps_latitude=serializer.validated_data.get('gps_latitude'),
                gps_longitude=serializer.validated_data.get('gps_longitude'),
                device_info=serializer.validated_data.get('device_info', ''),
                ip_address=request.META.get('REMOTE_ADDR'),
                check_in_method='QR_CODE',
            )
            AttendanceLog.objects.create(
                attendance=attendance,
                action='CHECK_IN',
                details={'method': 'QR_CODE', 'qr_token': str(qr_token)}
            )
            logger.info(
                f"Check-in: {employee.matricule} at {now.isoformat()}"
            )
        except IntegrityError:
            return Response(
                {'error': 'Erreur lors du pointage'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            AttendanceSerializer(attendance).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        serializer = CheckOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            attendance = Attendance.objects.get(
                id=serializer.validated_data['attendance_id'],
                check_out__isnull=True
            )
        except Attendance.DoesNotExist:
            return Response(
                {'error': 'Pointage non trouvé ou déjà cloturé'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        attendance.check_out = now
        attendance.gps_latitude = serializer.validated_data.get(
            'gps_latitude', attendance.gps_latitude
        )
        attendance.gps_longitude = serializer.validated_data.get(
            'gps_longitude', attendance.gps_longitude
        )

        schedule_qs = EmployeeSchedule.objects.filter(
            employee=attendance.employee,
            is_active=True,
            start_date__lte=attendance.date
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=attendance.date)
        ).select_related('schedule')

        if schedule_qs.exists():
            schedule = schedule_qs.first().schedule
            scheduled_exit = timezone.datetime.combine(
                attendance.date, schedule.exit_time
            )
            if now < timezone.make_aware(scheduled_exit):
                attendance.status = Attendance.Status.EARLY_LEAVE

        attendance.save()
        AttendanceLog.objects.create(
            attendance=attendance,
            action='CHECK_OUT',
            details={'time': now.isoformat()}
        )
        logger.info(
            f"Check-out: {attendance.employee.matricule} at {now.isoformat()}"
        )

        return Response(AttendanceSerializer(attendance).data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        qs = self.queryset.filter(date=today)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        today = timezone.localdate()
        total_employees = Employee.objects.filter(statut='ACTIF').count()

        today_attendance = Attendance.objects.filter(date=today)
        present = today_attendance.filter(
            status=Attendance.Status.PRESENT
        ).count()
        late = today_attendance.filter(
            status=Attendance.Status.LATE
        ).count()
        early_leaves = today_attendance.filter(
            status=Attendance.Status.EARLY_LEAVE
        ).count()
        absent = total_employees - present - late - early_leaves

        # Live check-ins today
        live_pointages = AttendanceSerializer(
            today_attendance.filter(check_out__isnull=True)
            .select_related('employee__department')[:10],
            many=True
        ).data

        # Weekly stats
        week_start = today - timedelta(days=today.weekday())
        weekly_data = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            day_count = Attendance.objects.filter(date=day).count()
            weekly_data.append({
                'date': day.isoformat(),
                'count': day_count,
                'day_name': day.strftime('%A')
            })

        # Department stats
        dept_stats = (
            Attendance.objects.filter(date=today)
            .values('employee__department__name')
            .annotate(
                total=Count('id'),
                presents=Count('id', filter=Q(status=Attendance.Status.PRESENT)),
                lates=Count('id', filter=Q(status=Attendance.Status.LATE)),
            )
        )

        return Response({
            'total_employees': total_employees,
            'present': present,
            'absent': absent,
            'late': late,
            'early_leaves': early_leaves,
            'live_pointages': live_pointages,
            'weekly_data': weekly_data,
            'department_stats': list(dept_stats),
        })

    @action(detail=False, methods=['get'])
    def logs(self, request):
        logs = AttendanceLog.objects.select_related(
            'attendance__employee'
        ).all()[:50]
        return Response(
            AttendanceLogSerializer(logs, many=True).data
        )
