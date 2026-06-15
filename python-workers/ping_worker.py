#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import sys

def run_ping(host, count):
    # Prepare standard output structure
    result = {
        "tool": "ping",
        "status": "FAILED",
        "packetLossPct": None,
        "throughputMbps": None,
        "rttMinMs": None,
        "rttAvgMs": None,
        "rttMaxMs": None,
        "jitterMs": None,
        "rawOutput": "",
        "errorMessage": None
    }

    try:
        # Run linux ping: -c specifies packet count, -W specifies timeout per packet in seconds
        cmd = ["ping", "-c", str(count), "-W", "2", host]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        raw_output = proc.stdout + proc.stderr
        result["rawOutput"] = raw_output

        if proc.returncode != 0 and not proc.stdout:
            result["errorMessage"] = f"Ping process failed. Stderr: {proc.stderr.strip()}"
            return result

        # Parse packet loss: e.g. "0% packet loss" or "100.0% packet loss"
        loss_match = re.search(r"(\d+(?:\.\d+)?)%\s+packet\s+loss", raw_output, re.IGNORECASE)
        if loss_match:
            result["packetLossPct"] = float(loss_match.group(1))

        # Parse RTT min/avg/max/mdev: e.g. "rtt min/avg/max/mdev = 8.1/12.4/17.0/1.5 ms"
        rtt_match = re.search(
            r"rtt\s+min/avg/max/mdev\s*=\s*([0-9.]+)/([0-9.]+)/([0-9.]+)/([0-9.]+)",
            raw_output,
            re.IGNORECASE
        )
        if rtt_match:
            result["rttMinMs"] = float(rtt_match.group(1))
            result["rttAvgMs"] = float(rtt_match.group(2))
            result["rttMaxMs"] = float(rtt_match.group(3))
            result["jitterMs"] = float(rtt_match.group(4)) # mdev acts as jitter in ping

        # Resolve status
        if result["packetLossPct"] is not None and result["packetLossPct"] < 100.0:
            result["status"] = "SUCCESS"
        else:
            result["status"] = "FAILED"
            result["errorMessage"] = "100% packet loss or unreachable host"

    except Exception as e:
        result["status"] = "FAILED"
        result["errorMessage"] = f"Unexpected script error: {str(e)}"

    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ProcessBuilder Ping Worker")
    parser.add_argument("--host", required=True, help="Target host to ping")
    parser.add_argument("--count", type=int, default=4, help="Number of packets")
    args = parser.parse_args()

    output = run_ping(args.host, args.count)
    # Ensure stdout only contains the JSON output
    print(json.dumps(output, indent=2))
    sys.exit(0 if output["status"] == "SUCCESS" else 1)
