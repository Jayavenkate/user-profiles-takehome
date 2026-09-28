from django.contrib.auth.models import User
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import PROFILE_IMAGE_VALIDATORS, UserProfile

USER_FIELDS = ['username', 'email', 'first_name', 'last_name']


class UserProfileSerializer(serializers.ModelSerializer):
    """
    One flat object with the User fields and the UserProfile fields together.

    Flat (not nested) so the same field names work for JSON and for
    multipart form data, which is needed for the image upload.
    """

    username = serializers.CharField(
        source='user.username',
        max_length=150,
        validators=[UnicodeUsernameValidator()],
    )
    email = serializers.EmailField(source='user.email', max_length=254)
    first_name = serializers.CharField(source='user.first_name', max_length=150)
    last_name = serializers.CharField(source='user.last_name', max_length=150)
    # allow_null lets a client clear the image: `null` in JSON, or an empty
    # value in multipart form data.
    profile_image = serializers.ImageField(
        required=False,
        allow_null=True,
        validators=PROFILE_IMAGE_VALIDATORS,
    )

    class Meta:
        model = UserProfile
        fields = [
            'id',
            *USER_FIELDS,
            'phone',
            'gender',
            'date_of_birth',
            'job_title',
            'department',
            'city',
            'country',
            'bio',
            'profile_image',
            'hire_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def _other_users(self):
        users = User.objects.all()
        if self.instance is not None:
            users = users.exclude(pk=self.instance.user_id)
        return users

    def validate_username(self, value):
        if self._other_users().filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        value = value.lower()
        if self._other_users().filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_date_of_birth(self, value):
        if value >= timezone.localdate():
            raise serializers.ValidationError('Date of birth must be in the past.')
        return value

    def validate(self, attrs):
        date_of_birth = attrs.get('date_of_birth', getattr(self.instance, 'date_of_birth', None))
        hire_date = attrs.get('hire_date', getattr(self.instance, 'hire_date', None))
        if date_of_birth and hire_date and hire_date <= date_of_birth:
            raise serializers.ValidationError({'hire_date': 'Hire date must be after date of birth.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = User(**user_data)
        # Profiles are managed records, not login accounts.
        user.set_unusable_password()
        user.save()
        return UserProfile.objects.create(user=user, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for field, value in user_data.items():
            setattr(instance.user, field, value)
        if user_data:
            instance.user.save()
        return super().update(instance, validated_data)
