#!/usr/bin/env python3
import os
import sys
import time
import re
import json
import subprocess
import requests

# Default Configuration
PORTAL_SERVER_URL = os.environ.get("PORTAL_SERVER_URL", "http://localhost:8082")
AGENT_TOKEN = os.environ.get("AGENT_TOKEN", "")
POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "5"))

def run_ping(host, count):
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
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
        
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
            result["jitterMs"] = float(rtt_match.group(4))

        if result["packetLossPct"] is not None and result["packetLossPct"] < 100.0:
            result["status"] = "SUCCESS"
        else:
            result["status"] = "FAILED"
            result["errorMessage"] = "100% packet loss or unreachable host"

    except subprocess.TimeoutExpired:
        result["status"] = "TIMEOUT"
        result["errorMessage"] = "Ping execution timed out."
    except Exception as e:
        result["status"] = "FAILED"
        result["errorMessage"] = f"Unexpected script error: {str(e)}"

    return result

def run_iperf(server, duration, protocol, port):
    result = {
        "tool": "iperf3",
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
        # Construct iperf3 command with JSON output format (-J)
        cmd = ["iperf3", "-c", server, "-t", str(duration), "-p", str(port), "-J"]
        if protocol.lower() == "udp":
            cmd.append("-u")

        # Run process
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=duration + 10)
        
        stdout_output = proc.stdout
        stderr_output = proc.stderr
        
        result["rawOutput"] = stdout_output if stdout_output else stderr_output

        if proc.returncode != 0 and not stdout_output:
            result["errorMessage"] = f"iperf3 failed to execute. Stderr: {stderr_output.strip()}"
            return result

        try:
            data = json.loads(stdout_output)
            
            if "error" in data:
                result["errorMessage"] = f"iperf3 error: {data['error']}"
                return result

            if protocol.lower() == "udp":
                sum_data = data.get("end", {}).get("sum", {})
                bps = sum_data.get("bits_per_second", 0)
                result["throughputMbps"] = round(bps / 1_000_000.0, 2)
                result["packetLossPct"] = round(sum_data.get("lost_percent", 0.0), 2)
                result["jitterMs"] = round(sum_data.get("jitter_ms", 0.0), 3)
            else:
                end_data = data.get("end", {})
                sum_received = end_data.get("sum_received", {})
                sum_sent = end_data.get("sum_sent", {})
                
                bps = sum_received.get("bits_per_second")
                if bps is None:
                    bps = sum_sent.get("bits_per_second", 0)
                
                result["throughputMbps"] = round(bps / 1_000_000.0, 2)
                
                retransmits = sum_sent.get("retransmits", 0)
                result["rawOutput"] += f"\nRetransmissions: {retransmits}"

            result["status"] = "SUCCESS"

        except json.JSONDecodeError:
            result["errorMessage"] = "Failed to parse iperf3 JSON output."

    except subprocess.TimeoutExpired:
        result["status"] = "TIMEOUT"
        result["errorMessage"] = "iperf3 execution timed out."
    except FileNotFoundError:
        result["errorMessage"] = "iperf3 binary not found. Please install iperf3 on the host system."
    except Exception as e:
        result["errorMessage"] = f"Unexpected script error: {str(e)}"

    return result

def main():
    if not AGENT_TOKEN:
        print("Error: AGENT_TOKEN environment variable is required.", file=sys.stderr)
        sys.exit(1)

    print(f"Starting Network Subnet Monitoring Agent...")
    print(f"Portal Server: {PORTAL_SERVER_URL}")
    print(f"Polling interval: {POLL_INTERVAL_SECONDS}s")
    print("Agent is active. Waiting for tasks...")

    headers = {
        "X-Agent-Token": AGENT_TOKEN,
        "Content-Type": "application/json"
    }

    while True:
        try:
            # Poll for task
            poll_url = f"{PORTAL_SERVER_URL}/api/v1/agents/poll"
            response = requests.get(poll_url, headers=headers, timeout=10)

            if response.status_code == 200:
                task = response.json()
                job_id = task["jobId"]
                protocol = task["protocol"]
                host = task["host"]
                server = task["server"]
                count = task.get("count", 4)
                duration = task.get("durationSeconds", 10)
                port = task.get("port", 5201)

                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Received Job #{job_id}: {protocol}")

                # Execute task
                if protocol == "PING":
                    output = run_ping(host, count)
                else:
                    # IPERF_TCP or IPERF_UDP
                    iperf_proto = "udp" if "udp" in protocol.lower() else "tcp"
                    output = run_iperf(server, duration, iperf_proto, port)

                # Submit results
                submit_url = f"{PORTAL_SERVER_URL}/api/v1/agents/results/{job_id}"
                submit_resp = requests.post(submit_url, headers=headers, json=output, timeout=10)
                
                if submit_resp.status_code == 200:
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Job #{job_id} executed and result submitted successfully.")
                else:
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Failed to submit result for Job #{job_id}. Status: {submit_resp.status_code}")

            elif response.status_code == 204:
                # No tasks, normal sleep
                pass
            else:
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Poll failed. Status code: {response.status_code}")

        except requests.exceptions.ConnectionError:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Connection error. Portal server is unreachable. Retrying in 10s...")
            time.sleep(5) # wait extra time before retry
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error in polling loop: {str(e)}")

        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
