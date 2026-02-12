def get_system_uptime():
    try:
        with open("/proc/uptime", "r") as f:
            return float(f.readline().split()[-1])
    except Exception as e:
        print(f"Error reading system uptime: {str(e)}")
        return 0.0


def get_version_number():
    try:
        with open("/home/tsl/Time-synced-lyrics/src/version_number", "r") as f:
            return str(f.readline().strip())
    except Exception as e:
        print(f"Error reading version number: {str(e)}")
        return "unknown"
