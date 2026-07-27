from django.urls import path

from .views import HomeItemListCreateView, delete_home_item

urlpatterns = [
    path("home-items/", HomeItemListCreateView.as_view(), name="home-item-list-create"),
    path("home-items/<int:pk>/", delete_home_item, name="home-item-delete"),
]
