import socket
import sys
import logging
import threading
import time
from datetime import datetime

# =========================
# Config - PDU Simulator
# =========================
SNMP_HOST = "0.0.0.0"
SNMP_PORT = 161  # Standard SNMP port
DEVICE_TYPE = "sinetic_pdu"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_pdu_responses():
    """Return responses for SINETIC PDU SNMP OIDs"""
    # Get current timestamp for sysUpTime and hrSystemDate
    current_time = int(time.time())
    uptime_centiseconds = current_time * 100  # sysUpTime in hundredths of seconds
    
    # hrSystemDate format: DateAndTime (8 octets: year, month, day, hour, minute, second, deci-seconds, timezone)
    dt = datetime.now()
    hr_date = bytes([
        (dt.year >> 8) & 0xFF, dt.year & 0xFF,  # Year (2 bytes)
        dt.month,  # Month
        dt.day,    # Day
        dt.hour,   # Hour
        dt.minute, # Minute
        dt.second, # Second
        0,         # Deci-seconds
        0          # Timezone (0 = UTC)
    ])
    
    return {
        # Standard SNMP System OIDs
        '1.3.6.1.2.1.1.1.0': b'SINETIC PDU Power Distribution Unit v2.1.5',  # sysDescr
        '1.3.6.1.2.1.1.2.0': b'1.3.6.1.4.1.3711.24',  # sysObjectID (SINETIC Enterprise OID)
        '1.3.6.1.2.1.1.3.0': str(uptime_centiseconds).encode('utf-8'),  # sysUpTime
        '1.3.6.1.2.1.1.4.0': b'admin@company.com',  # sysContact
        '1.3.6.1.2.1.1.5.0': b'PDU-RACK-A15-01',  # sysName
        '1.3.6.1.2.1.1.6.0': b'Data Center - Rack A15',  # sysLocation
        
        # Host Resources MIB
        '1.3.6.1.2.1.25.1.2.0': hr_date,  # hrSystemDate
        '1.3.6.1.2.1.25.2.2.0': b'8589934592',  # hrMemorySize (8GB in KB = 8388608 KB)
        
        # PDU-Level OIDs (SINETIC)
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.1': b'1',  # PDU number
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.2': b'PDU-RACK-A15-01',  # PDU name
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.3': b'1',  # Operational status (1=normal, 2=warning, 3=critical)
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.4': b'230',  # Input voltage (V)
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.5': b'15.5',  # Input current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.6': b'3565',  # Power in watts
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.7': b'12345.67',  # Energy consumption (kWh)
        '1.3.6.1.4.1.3711.24.1.1.7.3.1.1.8': b'28',  # Internal temperature sensor (°C)
        
        # Outlet-Level OIDs (SINETIC) - Outlet 1
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.1': b'1',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.1': b'1',  # Outlet status (1=on, 0=off)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.1': b'2.5',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.1': b'575',  # Outlet power in watts
        
        # Outlet-Level OIDs - Outlet 2
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.2': b'2',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.2': b'1',  # Outlet status (on)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.2': b'3.2',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.2': b'736',  # Outlet power in watts
        
        # Outlet-Level OIDs - Outlet 3
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.3': b'3',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.3': b'0',  # Outlet status (off)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.3': b'0.0',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.3': b'0',  # Outlet power in watts
        
        # Outlet-Level OIDs - Outlet 4
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.4': b'4',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.4': b'1',  # Outlet status (on)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.4': b'4.8',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.4': b'1104',  # Outlet power in watts
        
        # Outlet-Level OIDs - Outlet 5
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.5': b'5',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.5': b'1',  # Outlet status (on)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.5': b'2.1',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.5': b'483',  # Outlet power in watts
        
        # Outlet-Level OIDs - Outlet 6
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.6': b'6',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.6': b'0',  # Outlet status (off)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.6': b'0.0',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.6': b'0',  # Outlet power in watts
        
        # Outlet-Level OIDs - Outlet 7
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.7': b'7',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.7': b'1',  # Outlet status (on)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.7': b'1.8',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.7': b'414',  # Outlet power in watts
        
        # Outlet-Level OIDs - Outlet 8
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1.8': b'8',  # Outlet number
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2.8': b'1',  # Outlet status (on)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3.8': b'0.9',  # Outlet current (A)
        '1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4.8': b'207',  # Outlet power in watts
    }

def encode_oid(oid_str):
    """Encode OID string to bytes"""
    parts = [int(x) for x in oid_str.split('.')]
    if len(parts) < 2:
        return bytes()
    
    # First two parts combined as (first * 40 + second)
    encoded = [parts[0] * 40 + parts[1]]
    encoded.extend(parts[2:])
    
    result = []
    for part in encoded:
        if part < 128:
            result.append(part)
        else:
            # Multi-byte encoding for values >= 128
            temp = []
            while part > 0:
                temp.insert(0, (part & 0x7F) | (0x80 if temp else 0))
                part >>= 7
            result.extend(temp)
    
    return bytes(result)

def decode_oid(oid_bytes):
    """Decode OID bytes to string"""
    if len(oid_bytes) == 0:
        return ""
    
    # First byte encodes first two identifiers
    first_byte = oid_bytes[0]
    first_id = first_byte // 40
    second_id = first_byte % 40
    oid_parts = [str(first_id), str(second_id)]
    
    i = 1
    while i < len(oid_bytes):
        value = 0
        while i < len(oid_bytes):
            byte_val = oid_bytes[i]
            value = (value << 7) | (byte_val & 0x7F)
            i += 1
            if (byte_val & 0x80) == 0:
                break
        oid_parts.append(str(value))
    
    return '.'.join(oid_parts)

def create_snmp_response(request_id, oid, value, error_status=0):
    """Create proper SNMP GET response"""
    response = bytearray()
    
    # SNMP version (SNMPv1 = 0)
    response.extend(b'\x02\x01\x00')
    
    # Community string "public"
    community = b'public'
    response.extend(b'\x04')
    response.extend([len(community)])
    response.extend(community)
    
    # Build PDU
    pdu_data = bytearray()
    
    # Request ID
    pdu_data.extend(b'\x02\x04')
    pdu_data.extend(request_id.to_bytes(4, 'big'))
    
    # Error status
    pdu_data.extend(b'\x02\x01')
    pdu_data.extend([error_status])
    
    # Error index
    pdu_data.extend(b'\x02\x01\x00')
    
    # Variable bindings
    vb_data = bytearray()
    vb_item = bytearray()
    
    # OID
    oid_encoded = encode_oid(oid)
    vb_item.extend(b'\x06')
    vb_item.extend([len(oid_encoded)])
    vb_item.extend(oid_encoded)
    
    # Value
    if error_status == 0:  # No error
        # Special handling for sysObjectID - should be OBJECT IDENTIFIER
        if oid == '1.3.6.1.2.1.1.2.0':
            # Encode as OBJECT IDENTIFIER
            if isinstance(value, bytes):
                oid_value = value.decode('utf-8')
            else:
                oid_value = str(value)
            oid_encoded = encode_oid(oid_value)
            vb_item.extend(b'\x06')  # OBJECT IDENTIFIER
            vb_item.extend([len(oid_encoded)])
            vb_item.extend(oid_encoded)
        # Special handling for hrSystemDate - OCTET STRING
        elif oid == '1.3.6.1.2.1.25.1.2.0':
            vb_item.extend(b'\x04')  # OCTET STRING
            vb_item.extend([len(value)])
            vb_item.extend(value)
        else:
            # Regular OCTET STRING encoding
            if isinstance(value, str):
                value = value.encode('utf-8')
            vb_item.extend(b'\x04')  # OCTET STRING
            vb_item.extend([len(value)])
            vb_item.extend(value)
    else:  # Error response
        vb_item.extend(b'\x80')  # noSuchObject
        vb_item.extend(b'\x00')
    
    # Wrap in sequence
    vb_data.extend(b'\x30')
    vb_data.extend([len(vb_item)])
    vb_data.extend(vb_item)
    
    # Add to PDU
    pdu_data.extend(b'\x30')
    pdu_data.extend([len(vb_data)])
    pdu_data.extend(vb_data)
    
    # GetResponse PDU
    response.extend(b'\xA2')
    response.extend([len(pdu_data)])
    response.extend(pdu_data)
    
    # Final message wrapper
    message = bytearray()
    message.extend(b'\x30')
    message.extend([len(response)])
    message.extend(response)
    
    return bytes(message)

def parse_snmp_request(data):
    """Parse SNMP request"""
    try:
        # Find OID in request
        for i in range(len(data) - 5):
            if data[i] == 0x06:  # OBJECT IDENTIFIER tag
                oid_length = data[i + 1]
                if i + 2 + oid_length <= len(data):
                    oid_bytes = data[i + 2:i + 2 + oid_length]
                    oid = decode_oid(oid_bytes)
                    
                    # Find request ID
                    request_id = 1
                    for j in range(max(0, i - 30), i):
                        if data[j] == 0x02 and j + 5 < len(data) and data[j + 1] == 0x04:
                            request_id = int.from_bytes(data[j + 2:j + 6], 'big')
                            break
                    
                    return oid, request_id
    except Exception as e:
        logger.debug(f"Parse error: {e}")
    
    return None, 1

def handle_snmp_request(sock, data, addr):
    """Handle SNMP request for PDU"""
    try:
        oid, request_id = parse_snmp_request(data)
        
        if oid:
            logger.info(f"SNMP GET from {addr[0]}:{addr[1]} - OID: {oid}")
            
            responses = get_pdu_responses()
            
            if oid in responses:
                response_value = responses[oid]
                logger.info(f"✓ PDU Response: {response_value.decode('utf-8', errors='ignore')[:60]}...")
                response = create_snmp_response(request_id, oid, response_value)
                sock.sendto(response, addr)
            else:
                # Check for partial matches (indexed OIDs)
                found = False
                for known_oid in responses:
                    if oid.startswith(known_oid.rsplit('.', 1)[0]):
                        response_value = responses[known_oid]
                        logger.info(f"✓ PDU Pattern Match: {response_value.decode('utf-8', errors='ignore')[:60]}...")
                        response = create_snmp_response(request_id, oid, response_value)
                        sock.sendto(response, addr)
                        found = True
                        break
                
                if not found:
                    logger.warning(f"✗ Unknown OID: {oid}")
                    # Send noSuchObject response
                    response = create_snmp_response(request_id, oid, b"", error_status=2)
                    sock.sendto(response, addr)
        else:
            logger.debug("Could not parse SNMP request")
            
    except Exception as e:
        logger.error(f"Request handling error: {e}")

def start_pdu_emulator():
    """Start PDU emulator on port 161"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((SNMP_HOST, SNMP_PORT))
        
        print("=" * 80)
        print("⚡ SINETIC PDU Power Distribution Unit SNMP Simulator")
        print("=" * 80)
        print(f"📡 SNMP Agent: {SNMP_HOST}:{SNMP_PORT}")
        print(f"🏷️  Enterprise OID: 1.3.6.1.4.1.3711.24 (SINETIC)")
        print(f"🔌 Device: SINETIC PDU Power Distribution Unit v2.1.5")
        print(f"📍 Location: Data Center - Rack A15")
        print()
        print("📊 SIMULATED COMPONENTS:")
        print("   ✓ Standard SNMP System OIDs (sysDescr, sysObjectID, etc.)")
        print("   ✓ Host Resources MIB (hrSystemDate, hrMemorySize)")
        print("   ✓ PDU-Level Information:")
        print("     • PDU Number: 1")
        print("     • PDU Name: PDU-RACK-A15-01")
        print("     • Operational Status: Normal")
        print("     • Input Voltage: 230V")
        print("     • Input Current: 15.5A")
        print("     • Power: 3565W")
        print("     • Energy Consumption: 12345.67 kWh")
        print("     • Internal Temperature: 28°C")
        print("   ✓ Outlet-Level Information (8 outlets):")
        print("     • Outlet status (on/off)")
        print("     • Outlet current (A)")
        print("     • Outlet power (W)")
        print("=" * 80)
        print("✅ Ready for SNMP queries - PDU OIDs supported")
        print("🛑 Press Ctrl+C to stop")
        print("=" * 80)
        
        logger.info("PDU SNMP emulator started - ready for queries")
        
        while True:
            try:
                data, addr = sock.recvfrom(1024)
                threading.Thread(
                    target=handle_snmp_request,
                    args=(sock, data, addr),
                    daemon=True
                ).start()
                
            except Exception as e:
                logger.error(f"Receive error: {e}")
                time.sleep(0.1)
                
    except PermissionError:
        print("❌ ERROR: Permission denied for port 161")
        print("🔧 Solution: Run as Administrator")
        print("   Right-click Command Prompt → 'Run as administrator'")
        print("   Then run: python pdu_snmp.py")
        return False
    except OSError as e:
        if "Address already in use" in str(e):
            print("❌ ERROR: Port 161 already in use")
            print("🔧 Solution: Stop other SNMP services or use different port")
        else:
            print(f"❌ ERROR: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 PDU SNMP Emulator stopped")
        logger.info("Emulator stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"❌ ERROR: {e}")
    finally:
        try:
            sock.close()
        except:
            pass
    
    return True

if __name__ == "__main__":
    print("Starting SINETIC PDU SNMP Simulator...")
    print("This will simulate a real SINETIC Power Distribution Unit")
    print()
    
    success = start_pdu_emulator()
    if not success:
        input("Press Enter to exit...")
        sys.exit(1)