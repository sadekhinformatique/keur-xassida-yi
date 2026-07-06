from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from datetime import date, timedelta
import csv
import io
import openpyxl
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

from attendance.models import Attendance
from employees.models import Employee
from attendance.serializers import AttendanceSerializer


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_filtered_queryset(self, request):
        qs = Attendance.objects.select_related(
            'employee__department', 'employee__service'
        ).all()

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        employee_id = request.query_params.get('employee')
        department_id = request.query_params.get('department')
        service_id = request.query_params.get('service')
        status = request.query_params.get('status')

        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if department_id:
            qs = qs.filter(employee__department_id=department_id)
        if service_id:
            qs = qs.filter(employee__service_id=service_id)
        if status:
            qs = qs.filter(status=status)

        return qs

    def list(self, request):
        qs = self._get_filtered_queryset(request)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AttendanceSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = AttendanceSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = self._get_filtered_queryset(request)
        total = qs.count()
        summary = {
            'total': total,
            'present': qs.filter(status='PRESENT').count(),
            'absent': qs.filter(status='ABSENT').count(),
            'late': qs.filter(status='LATE').count(),
            'early_leave': qs.filter(status='EARLY_LEAVE').count(),
        }
        return Response(summary)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        qs = self._get_filtered_queryset(request)
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="rapport_pointage.csv"'
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow(['Matricule', 'Employé', 'Département', 'Service',
                        'Date', 'Entrée', 'Sortie', 'Statut', 'Méthode'])

        for a in qs:
            writer.writerow([
                a.employee.matricule,
                f"{a.employee.nom} {a.employee.prenom}",
                a.employee.department.name if a.employee.department else '',
                a.employee.service.name if a.employee.service else '',
                a.date,
                a.check_in.strftime('%H:%M:%S') if a.check_in else '',
                a.check_out.strftime('%H:%M:%S') if a.check_out else '',
                a.get_status_display(),
                a.get_check_in_method_display(),
            ])

        return response

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        qs = self._get_filtered_queryset(request)
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Rapport Pointage"

        headers = ['Matricule', 'Employé', 'Département', 'Service',
                   'Date', 'Entrée', 'Sortie', 'Statut', 'Méthode']
        ws.append(headers)

        for a in qs:
            ws.append([
                a.employee.matricule,
                f"{a.employee.nom} {a.employee.prenom}",
                a.employee.department.name if a.employee.department else '',
                a.employee.service.name if a.employee.service else '',
                str(a.date),
                a.check_in.strftime('%H:%M:%S') if a.check_in else '',
                a.check_out.strftime('%H:%M:%S') if a.check_out else '',
                a.get_status_display(),
                a.get_check_in_method_display(),
            ])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="rapport_pointage.xlsx"'
        wb.save(response)
        return response

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        qs = self._get_filtered_queryset(request)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, title="Rapport de Pointage")
        styles = getSampleStyleSheet()

        elements = []
        elements.append(Paragraph("Rapport de Pointage", styles['Title']))

        data = [['Matricule', 'Employé', 'Date', 'Entrée', 'Sortie', 'Statut']]
        for a in qs[:100]:
            data.append([
                a.employee.matricule,
                f"{a.employee.nom[:15]} {a.employee.prenom[:15]}",
                str(a.date),
                a.check_in.strftime('%H:%M') if a.check_in else '-',
                a.check_out.strftime('%H:%M') if a.check_out else '-',
                a.get_status_display(),
            ])

        table = Table(data, colWidths=[60, 100, 70, 60, 60, 60])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(table)

        doc.build(elements)
        response = HttpResponse(
            buffer.getvalue(), content_type='application/pdf'
        )
        response['Content-Disposition'] = 'attachment; filename="rapport_pointage.pdf"'
        return response
