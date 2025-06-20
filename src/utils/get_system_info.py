def get_system_uptime():
    with open("/proc/uptime", "r") as f:
        uptime_seconds = float(f.readline().split()[-1])

    return uptime_seconds

def get_version_number():
    with open("/home/tsl/Time-synced-lyrics/src/version_number", "r") as f:
        version_number = float(f.readline().strip())

    return version_number