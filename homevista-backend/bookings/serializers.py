from datetime import datetime, timedelta
from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from properties.serializers import PropertySerializer
from users.serializers import UserSerializer

class BookingSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    customer_details = UserSerializer(source='customer', read_only=True)
    duration_text = serializers.SerializerMethodField()
    contract_id = serializers.SerializerMethodField()
    contract_status = serializers.SerializerMethodField()
    offer_id = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'property', 'customer', 'date', 'time', 'start_datetime', 'end_datetime', 'status', 
            'owner_confirmed', 'customer_confirmed', 'payment_proof',
            'owner_request_reversal', 'customer_request_reversal',
            'notes', 'created_at', 'updated_at', 'duration_text', 'property_details', 'customer_details',
            'contract_id', 'contract_status'
        ]
        read_only_fields = ('customer', 'created_at', 'updated_at', 'duration_text', 'contract_id', 'contract_status')

    def get_duration_text(self, obj):
        return obj.margin_time_label()

    def get_contract_id(self, obj):
        return obj.contract.id if hasattr(obj, 'contract') and obj.contract else None

    def get_contract_status(self, obj):
        return obj.contract.status if hasattr(obj, 'contract') and obj.contract else None

    def get_offer_id(self, obj):
        return obj.offer.id if obj.offer else None

    def validate(self, data):
        """
        Check for overlapping bookings and validate booking runtime.
        """
        prop = data.get('property')
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        date = data.get('date')
        time = data.get('time')

        if not start_datetime and date and time:
            start_datetime = datetime.combine(date, time)
            data['start_datetime'] = start_datetime

        if start_datetime and not end_datetime:
            end_datetime = start_datetime + timedelta(hours=3)
            data['end_datetime'] = end_datetime

        if start_datetime and end_datetime and end_datetime <= start_datetime:
            raise serializers.ValidationError({
                'end_datetime': 'End time must be after start time.'
            })

        if prop and start_datetime:
            existing_booking = Booking.objects.filter(
                property=prop,
                start_datetime__lt=end_datetime,
                end_datetime__gt=start_datetime,
                status__in=['PENDING', 'APPROVED', 'FINALIZING', 'COMPLETED']
            ).exclude(id=self.instance.id if self.instance else None)
            if existing_booking.exists():
                raise serializers.ValidationError("This property is already booked for the selected time interval.")

        return data
