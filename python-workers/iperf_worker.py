#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys

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
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        stdout_output = proc.stdout
        stderr_output = proc.stderr
        
        result["rawOutput"] = stdout_output if stdout_output else stderr_output

        # Handle process start issues
        if proc.returncode != 0 and not stdout_output:
            result["errorMessage"] = f"iperf3 failed to execute. Stderr: {stderr_output.strip()}"
            return result

        # Parse iperf3 native JSON output
        try:
            data = json.loads(stdout_output)
            
            # Check for error fields inside iperf3 JSON
            if "error" in data:
                result["errorMessage"] = f"iperf3 error: {data['error']}"
                return result

            # Extract metrics based on protocol
            if protocol.lower() == "udp":
                sum_data = data.get("end", {}).get("sum", {})
                # throughput in bps -> convert to Mbps
                bps = sum_data.get("bits_per_second", 0)
                result["throughputMbps"] = round(bps / 1_000_000.0, 2)
                result["packetLossPct"] = round(sum_data.get("lost_percent", 0.0), 2)
                # Jitter is in milliseconds in iperf3 JSON output
                result["jitterMs"] = round(sum_data.get("jitter_ms", 0.0), 3)
            else:
                # TCP
                # iperf3 TCP json structure end contains sum_received and sum_sent
                end_data = data.get("end", {})
                sum_received = end_data.get("sum_received", {})
                sum_sent = end_data.get("sum_sent", {})
                
                # Use received if available, otherwise fallback to sent
                bps = sum_received.get("bits_per_second")
                if bps is None:
                    bps = sum_sent.get("bits_per_second", 0)
                
                result["throughputMbps"] = round(bps / 1_000_000.0, 2)
                
                # Check if retransmits exist as a proxy of connection stability
                retransmits = sum_sent.get("retransmits", 0)
                result["rawOutput"] += f"\nRetransmissions: {retransmits}"

            result["status"] = "SUCCESS"

        except json.JSONDecodeError as ex:
            result["errorMessage"] = f"Failed to parse iperf3 JSON. Raw Output: {stdout_output[:200]}..."

    except FileNotFoundError:
        result["errorMessage"] = "iperf3 binary not found. Please install iperf3 on the host system."
    except Exception as e:
        result["errorMessage"] = f"Unexpected script error: {str(e)}"

    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ProcessBuilder iperf3 Worker")
    parser.add_argument("--server", required=True, help="iperf3 server host")
    parser.add_argument("--duration", type=int, default=10, help="Test duration in seconds")
    parser.add_argument("--protocol", default="tcp", choices=["tcp", "udp"], help="Network protocol")
    parser.add_argument("--port", type=int, default=5201, help="Server port")
    args = parser.parse_args()

    output = run_iperf(args.server, args.duration, args.protocol, args.port)
    print(json.dumps(output, indent=2))
    sys.exit(0 if output["status"] == "SUCCESS" else 1)
