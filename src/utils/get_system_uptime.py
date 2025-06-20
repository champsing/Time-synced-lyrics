def get_system_uptime():
    with open("/proc/uptime", "r") as f:
        uptime_seconds = float(f.readline().split()[-1])

    return uptime_seconds