from pymavlink import mavutil

mav = mavutil.mavlink_connection('COM9', baud=57600)
print("Connected")