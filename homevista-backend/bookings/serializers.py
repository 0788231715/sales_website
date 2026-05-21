from rest_framework import serializers
from .models import Booking
from properties.serializers import PropertySerializer
from users.serializers import UserSerializer

class BookingSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    customer_details = UserSerializer(source='customer', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'property', 'customer', 'date', 'time', 'status', 
            'owner_confirmed', 'customer_confirmed', 'payment_proof',
            'owner_request_reversal', 'customer_request_reversal',
            'notes', 'created_at', 'updated_at', 'property_details', 'customer_details'
        ]
        read_only_fields = ('customer', 'created_at', 'updated_at')

    def validate(self, data):
        """
        Check for overlapping bookings on the same property and date/time.
        """
        prop = data.get('property')
        date = data.get('date')
        time = data.get('time')
        
        # Simple overlap check: same date and time slot
        # In a real app, you might want to check for a range (e.g., 1 hour slot)
        existing_booking = Booking.objects.filter(
            property=prop,
            date=date,
            time=time,
            status__in=['PENDING', 'APPROVED', 'FINALIZING', 'COMPLETED']
        ).exclude(id=self.instance.id if self.instance else None)
        
        if existing_booking.exists():
            raise serializers.ValidationError("This property is already booked for the selected date and time.")
            
        return data
