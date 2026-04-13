# 🔧 SNMP Client Troubleshooting Guide

## ✅ Confirmed: NetApp Emulator is Working
- OID `1.3.6.1.2.1.1.2.0` responds correctly
- Returns: `1.3.6.1.4.1.789.2.7` (NetApp Storage Server)
- Response time: 4ms

## ❌ Issue: Your SNMP Client Configuration

### 🧪 Test from Command Line
Try these manual tests to verify:

```bash
# Test sysObjectID (should work)
snmpget -v1 -c public 192.168.46.249 1.3.6.1.2.1.1.2.0

# Test sysDescr (should work) 
snmpget -v1 -c public 192.168.46.249 1.3.6.1.2.1.1.1.0

# Test NetApp Product Name (should work)
snmpget -v1 -c public 192.168.46.249 1.3.6.1.4.1.789.1.1.2.0
```

### 🔍 Possible Issues

#### 1. **SNMP Version Mismatch**
```
❌ If using SNMPv2c: snmpget -v2c -c public 192.168.46.249 1.3.6.1.2.1.1.2.0
✅ Use SNMPv1:      snmpget -v1 -c public 192.168.46.249 1.3.6.1.2.1.1.2.0
```

#### 2. **Wrong Community String**
```
❌ Wrong:  snmpget -v1 -c private 192.168.46.249 1.3.6.1.2.1.1.2.0
✅ Correct: snmpget -v1 -c public 192.168.46.249 1.3.6.1.2.1.1.2.0
```

#### 3. **Network/Firewall Issues**
```bash
# Test basic connectivity
ping 192.168.46.249

# Test UDP port 161
telnet 192.168.46.249 161  # (Will fail but shows if port is blocked)

# Test from localhost (should always work)
snmpget -v1 -c public 127.0.0.1 1.3.6.1.2.1.1.2.0
```

#### 4. **SNMP Discovery Tool Configuration**
Check your discovery tool settings:
- **SNMP Version**: Must be `SNMPv1` or `SNMPv2c`
- **Community**: Must be `public`
- **Port**: Must be `161`
- **Timeout**: Increase to 5-10 seconds
- **Retries**: Set to 2-3 attempts

#### 5. **OID Format Issues**
Some tools require different OID formats:
```
✅ Dotted decimal: 1.3.6.1.2.1.1.2.0
✅ With leading dot: .1.3.6.1.2.1.1.2.0
❌ Named format: sysObjectID.0  (may not work)
```

### 🛠️ Discovery Tool Checklist

#### **For Professional SNMP Tools:**
- [ ] SNMP Version = v1 or v2c
- [ ] Community String = "public"
- [ ] Target IP = 192.168.46.249
- [ ] Port = 161
- [ ] Timeout ≥ 5 seconds

#### **For Custom Scripts:**
```python
# Python example
from pysnmp.hlapi import *

for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
    SnmpEngine(),
    CommunityData('public'),  # ← Must be 'public'
    UdpTransportTarget(('192.168.46.249', 161)),  # ← Correct IP/port
    ContextData(),
    ObjectType(ObjectIdentity('1.3.6.1.2.1.1.2.0')),  # ← Exact OID
    lexicographicMode=False,
    ignoreNonIncreasingOid=True):
    
    if errorIndication:
        print(errorIndication)
        break
    elif errorStatus:
        print('%s at %s' % (errorStatus.prettyPrint(),
                            errorIndex and varBinds[int(errorIndex) - 1][0] or '?'))
        break
    else:
        for varBind in varBinds:
            print(' = '.join([x.prettyPrint() for x in varBind]))
```

### 🎯 Next Steps

1. **Test manually** with snmpget commands above
2. **Check your discovery tool configuration**
3. **Verify network connectivity**
4. **Compare working vs non-working OIDs**

If manual snmpget works but your discovery tool doesn't, the issue is in your tool's configuration, not the emulator.
