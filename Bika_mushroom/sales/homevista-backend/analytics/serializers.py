from rest_framework import serializers
from .models import PropertyInteraction, UserPreference

class PropertyInteractionSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)

    class Meta:
        model = PropertyInteraction
        fields = '__all__'

class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = '__all__'
