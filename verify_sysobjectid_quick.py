#!/usr/bin/env python3
"""
Quick test to verify sysObjectID is working from the emulator
"""
import socket

def test_sysobjectid_quickly():
    """Quick test of sysObjectID OID"""
    print("🧪 QUICK sysObjectID VERIFICATION")
    print("=" * 40)
    
    # SNMP GET request for sysObjectID (1.3.6.1.2.1.1.2.0)
    sysobjectid_request = bytes([
        0x30, 0x26,  # Sequence, length 38
        0x02, 0x01, 0x00,  # Version SNMPv1
        0x04, 0x06, 0x70, 0x75, 0x62, 0x6c, 0x69, 0x63,  # Community "public"
        0xa0, 0x19,  # GetRequest, length 25
        0x02, 0x01, 0x01,  # Request ID 1
        0x02, 0x01, 0x00,  # Error status 0
        0x02, 0x01, 0x00,  # Error index 0
        0x30, 0x0e,  # VarBindList, length 14
        0x30, 0x0c,  # VarBind, length 12
        0x06, 0x08, 0x2b, 0x06, 0x01, 0x02, 0x01, 0x01, 0x02, 0x00,  # OID 1.3.6.1.2.1.1.2.0
        0x05, 0x00   # Null value
    ])
    
    try:
        print("📤 Testing sysObjectID from emulator...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(3)
        
        # Test localhost
        sock.sendto(sysobjectid_request, ("127.0.0.1", 161))
        response, addr = sock.recvfrom(1024)
        
        # Extract value
        if b'1.3.6.1.4.1.789.2.7' in response:
            print("✅ sysObjectID WORKING: 1.3.6.1.4.1.789.2.7")
            print("✅ NetApp emulator is responding correctly")
            print()
            print("🎯 CONCLUSION:")
            print("   The problem is NOT with the emulator.")
            print("   Your discovery tool is not querying or")
            print("   not including sysObjectID in the response.")
            return True
        else:
            print("❌ Unexpected response from emulator")
            print(f"   Raw response: {response.hex()}")
            return False
            
        sock.close()
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_sysobjectid_quickly()
