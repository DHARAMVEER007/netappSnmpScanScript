import socket
import time

def test_snmp_emulator():
    """Test the NetApp SNMP emulator with a simple SNMP GET request"""
    
    # Simple SNMP GET request for sysDescr (1.3.6.1.2.1.1.1.0)
    snmp_request = bytes([
        0x30, 0x19,  # SEQUENCE, length 25
        0x02, 0x01, 0x00,  # INTEGER version=0 (SNMPv1)
        0x04, 0x06, 0x70, 0x75, 0x62, 0x6c, 0x69, 0x63,  # OCTET STRING "public"
        0xa0, 0x0c,  # GetRequest PDU
        0x02, 0x01, 0x01,  # Request ID = 1
        0x02, 0x01, 0x00,  # Error status = 0
        0x02, 0x01, 0x00,  # Error index = 0
        0x30, 0x00  # Empty variable bindings
    ])
    
    # More complete SNMP GET for sysDescr
    snmp_get_sysdescr = bytes([
        0x30, 0x26,  # SEQUENCE
        0x02, 0x01, 0x00,  # version = 0
        0x04, 0x06, 0x70, 0x75, 0x62, 0x6c, 0x69, 0x63,  # community = "public"
        0xa0, 0x19,  # GetRequest PDU
        0x02, 0x04, 0x00, 0x00, 0x00, 0x01,  # request-id = 1
        0x02, 0x01, 0x00,  # error-status = 0
        0x02, 0x01, 0x00,  # error-index = 0
        0x30, 0x0b,  # variable-bindings
        0x30, 0x09,  # variable binding
        0x06, 0x07, 0x2b, 0x06, 0x01, 0x02, 0x01, 0x01, 0x01,  # OID 1.3.6.1.2.1.1.1
        0x05, 0x00  # NULL value
    ])
    
    try:
        # Create UDP socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(5)  # 5 second timeout
        
        print("🧪 Testing NetApp SNMP Emulator...")
        print(f"📡 Sending SNMP GET request to localhost:161")
        
        # Send SNMP request
        sock.sendto(snmp_get_sysdescr, ('localhost', 161))
        
        # Wait for response
        response, addr = sock.recvfrom(1024)
        
        print(f"✅ SUCCESS: Received SNMP response from {addr}")
        print(f"📦 Response length: {len(response)} bytes")
        print(f"🔍 Response data: {response[:50]}...")
        
        # Check if it contains NetApp signature
        if b'NetApp' in response:
            print("🎯 CONFIRMED: NetApp signature found in response!")
            print("✅ Emulator is working correctly")
        else:
            print("⚠️  Response received but no NetApp signature detected")
            
        return True
        
    except socket.timeout:
        print("❌ TIMEOUT: No response from SNMP emulator")
        print("🔧 Check if the emulator is running")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    finally:
        sock.close()

if __name__ == "__main__":
    test_snmp_emulator()
