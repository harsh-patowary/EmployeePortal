from django.urls import path
from employee import views

# urlpatterns = [
#     path('', views.home, name="home"),
#     path('work', views.work, name="work"),
#     path('request', views.request, name="request"),
#     path('notice', views.notice, name="notice"),
#     path('attendance', views.attendance, name="attendance"),
# ]   
urlpatterns = [
    path('dashboard',views.dashboard,name="dashboard"),
    path('attendance',views.attendance,name="attendance"),
    path('notice',views.notice,name="notice"),
    path('noticedetail/<int:id>/',views.noticedetail,name="noticedetail"),
    path('assignwork',views.assignWork,name="assignwork"),
    path('mywork',views.mywork,name="mywork"),
    path('workdetails/<int:wid>/',views.workdetails,name="workdetails"),
    path('editAW',views.assignedworklist,name="assignedworklist"),
    path('deletework/<int:wid>/',views.deletework,name="deletework"),
    path('updatework/<int:wid>',views.updatework,name="updatework"),
    path('makeRequest',views.makeRequest,name="makeRequest"),
    path('viewRequest',views.viewRequest,name="viewRequest"),
    path('requestdetails/<int:rid>/',views.requestdetails,name="requestdetails"),
]