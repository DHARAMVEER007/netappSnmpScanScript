# NetApp & PDU SNMP scan / lab tools

Python utilities for **SNMP discovery and testing** against **NetApp ONTAP–style** and **SINETIC PDU–style** behavior. The main scripts can run as **UDP SNMP responders** (port **161**) so you can exercise scanners, monitoring tools, or custom clients without real hardware.

## Contents

| Item | Purpose |
|------|--------|
| `netapp_snmp.py` | NetApp-like SNMP responder (`sysObjectID` `1.3.6.1.4.1.789.2.7`, product/cluster/volume style OIDs). |
| `pdu_snmp.py` | SINETIC PDU–like responder (enterprise `1.3.6.1.4.1.3711.24`, outlets, power metrics). |
| `netapp_test.py` | Client-style **GET** tests against a running responder (edit host/port as needed). |
| `test.py` | Additional SNMP test harness (project-specific). |
| `verify_sysobjectid_quick.py` | Quick checks around **sysObjectID** discovery. |
| `analyze_missing_sysobjectid.py` | Analysis helper for missing **sysObjectID** cases. |
| `netapp_oids_to_query.txt` | OID list reference for NetApp queries. |
| `required_netapp_oids_for_discovery.txt` | OIDs relevant to discovery flows. |
| `snenso.jsx` | Related UI/script asset. |
| `AUTHENTICATION_INFO.md`, `SNMP_CLIENT_FIX.md`, `SOLUTION.md`, `troubleshoot_snmp_client.md`, `analyze_sensor_script.md` | Notes and troubleshooting from development. |

## Requirements

- **Python 3** (standard library only for the core responders and tests: `socket`, `logging`, `threading`, etc.).
- **UDP port 161** must be free and, on many systems, **elevated privileges** are required to bind to port 161.

## Quick start

**1. NetApp-style emulator**

```bash
python netapp_snmp.py
```

**2. PDU-style emulator**

```bash
python pdu_snmp.py
```

**3. Test from another terminal** (after pointing `netapp_test.py` at the correct host/IP if not localhost):

```bash
python netapp_test.py
```

Default bind address and port are set at the top of each responder script (`SNMP_HOST`, `SNMP_PORT`). Change them if you cannot use `0.0.0.0:161`.

## Security note

These tools are intended for **lab and development**. They emulate devices with **fixed, illustrative** SNMP data—not production secrets. Do not expose port 161 to untrusted networks.

## License

Add a license file if you plan to distribute this repository publicly.
