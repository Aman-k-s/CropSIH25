from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserSerializer
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

class Login(APIView):
    def post(self, request):
        user = get_object_or_404(User, username = request.data['username'])
        if not user.check_password(request.data['password']):
            return Response({"detail":"Not found"}, status=status.HTTP_404_NOT_FOUND)
        token, created = Token.objects.get_or_create(user = user)
        serializer = UserSerializer(instance = user)
        return Response({"token":token.key, "user":serializer.data})

class Signup(APIView):
    def post(self, request):
        serializer = UserSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            user = User.objects.get(username = request.data['username'])
            user.set_password(request.data['password'])
            user.save()
            token = Token.objects.create(user = user)
            return Response({"token":token.key, "user": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TestToken(APIView):
    def get(self, request):
        return Response("passed for {}".format(request.user.email))