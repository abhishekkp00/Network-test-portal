# Python Test Worker Scripts

This folder contains the execution layer wrapper scripts for executing standard networking binaries and parsing output to JSON.

## System Dependencies

Make sure `ping` and `iperf3` are installed on your Linux system:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install iputils-ping iperf3 -y
```

## Running workers manually

You can execute workers directly from command line to verify their outputs:

### 1. Ping Worker

```bash
python3 ping_worker.py --host 8.8.8.8 --count 3
```

**Expected stdout JSON:**
```json
{
  "tool": "ping",
  "status": "SUCCESS",
  "packetLossPct": 0.0,
  "throughputMbps": null,
  "rttMinMs": 11.23,
  "rttAvgMs": 12.45,
  "rttMaxMs": 14.12,
  "jitterMs": 0.52,
  "rawOutput": "...",
  "errorMessage": null
}
```

### 2. iPerf3 Worker

To test the iperf3 worker locally, you must have an iperf3 server running. You can run one locally in a separate shell:

```bash
iperf3 -s -p 5201
```

Then run the worker:
```bash
# TCP Test
python3 iperf_worker.py --server localhost --duration 5 --protocol tcp --port 5201

# UDP Test
python3 iperf_worker.py --server localhost --duration 5 --protocol udp --port 5201
```
