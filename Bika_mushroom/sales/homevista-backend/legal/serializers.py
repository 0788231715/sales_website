from rest_framework import serializers
from .models import Contract, ContractTemplate, SignatureLog

class ContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractTemplate
        fields = '__all__'

class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = '__all__'

class SignatureLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignatureLog
        fields = '__all__'
