import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from attendance.models import Attendance
from django.utils import timezone
from django.db.models import Count, Q


class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'dashboard'
        await self.channel_layer.group_add(
            self.group_name, self.channel_name
        )
        await self.accept()

        # Send initial data
        data = await self.get_dashboard_data()
        await self.send(text_data=json.dumps(data))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )

    async def receive(self, text_data):
        data = await self.get_dashboard_data()
        await self.send(text_data=json.dumps(data))

    async def dashboard_update(self, event):
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def get_dashboard_data(self):
        today = timezone.localdate()
        total = (
            Attendance.objects.filter(date=today).count()
        )
        present = Attendance.objects.filter(
            date=today, status='PRESENT'
        ).count()
        late = Attendance.objects.filter(
            date=today, status='LATE'
        ).count()
        early = Attendance.objects.filter(
            date=today, status='EARLY_LEAVE'
        ).count()

        return {
            'type': 'dashboard_update',
            'total': total,
            'present': present,
            'late': late,
            'early_leaves': early,
            'timestamp': timezone.now().isoformat(),
        }


class AttendanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'attendance_live'
        await self.channel_layer.group_add(
            self.group_name, self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )

    async def new_checkin(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def new_checkout(self, event):
        await self.send(text_data=json.dumps(event['data']))
