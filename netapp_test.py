import socket
import time

def test_netapp_oids():
    """Test specific NetApp OIDs"""
    
    # NetApp OIDs to test
    test_oids = [
        ("1.3.6.1.2.1.1.1.0", "System Description"),
        ("1.3.6.1.2.1.1.2.0", "System Object ID (Enterprise)"),
        ("1.3.6.1.2.1.1.5.0", "System Name"),
        ("1.3.6.1.4.1.789.1.1.2.0", "NetApp Product Name"),
        ("1.3.6.1.4.1.789.1.1.3.0", "NetApp Product Version"),
        ("1.3.6.1.4.1.789.1.1.6.0", "NetApp Product Model"),
        ("1.3.6.1.4.1.789.1.1.25.0", "NetApp Cluster Name"),
    ]
    
    def encode_oid(oid_str):
        """Simple OID encoder"""
        parts = [int(x) for x in oid_str.split('.')]
        if len(parts) < 2:
            return bytes()
        
        encoded = [parts[0] * 40 + parts[1]]
        encoded.extend(parts[2:])
        
        result = []
        for part in encoded:
            if part < 128:
                result.append(part)
            else:
                temp = []
                while part > 0:
                    temp.insert(0, (part & 0x7F) | (0x80 if temp else 0))
                    part >>= 7
                result.extend(temp)
        
        return bytes(result)
    
    def create_snmp_get(oid_str, request_id=1):
        """Create SNMP GET request"""
        oid_encoded = encode_oid(oid_str)
        
        # Variable binding
        vb = bytearray()
        vb.extend(b'\x06')  # OID tag
        vb.extend([len(oid_encoded)])
        vb.extend(oid_encoded)
        vb.extend(b'\x05\x00')  # NULL value
        
        # Variable binding sequence
        vb_seq = bytearray()
        vb_seq.extend(b'\x30')
        vb_seq.extend([len(vb)])
        vb_seq.extend(vb)
        
        # Variable bindings
        vbs = bytearray()
        vbs.extend(b'\x30')
        vbs.extend([len(vb_seq)])
        vbs.extend(vb_seq)
        
        # PDU
        pdu = bytearray()
        pdu.extend(b'\x02\x04')  # Request ID
        pdu.extend(request_id.to_bytes(4, 'big'))
        pdu.extend(b'\x02\x01\x00')  # Error status
        pdu.extend(b'\x02\x01\x00')  # Error index
        pdu.extend(vbs)
        
        # GetRequest
        get_req = bytearray()
        get_req.extend(b'\xa0')
        get_req.extend([len(pdu)])
        get_req.extend(pdu)
        
        # Message
        msg = bytearray()
        msg.extend(b'\x02\x01\x00')  # Version
        msg.extend(b'\x04\x06public')  # Community
        msg.extend(get_req)
        
        # Final wrapper
        final = bytearray()
        final.extend(b'\x30')
        final.extend([len(msg)])
        final.extend(msg)
        
        return bytes(final)
    
    print("🧪 Testing NetApp SNMP Emulator OIDs")
    print("=" * 60)
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(5)
    
    try:
        for i, (oid, description) in enumerate(test_oids, 1):
            print(f"\n📋 Test {i}: {description}")
            print(f"🔍 OID: {oid}")
            
            try:
                # Send request
                request = create_snmp_get(oid, i)
                sock.sendto(request, ('localhost', 161))
                
                # Receive response
                response, addr = sock.recvfrom(1024)
                
                print(f"✅ Response: {len(response)} bytes")
                
                # Try to extract readable content
                try:
                    readable = ""
                    for byte in response:
                        if 32 <= byte <= 126:  # Printable ASCII
                            readable += chr(byte)
                        elif byte == 0:
                            readable += " "
                    
                    # Look for NetApp content
                    if "NetApp" in readable or "ONTAP" in readable or "FAS" in readable:
                        print(f"🎯 NetApp Content: {readable}")
                    elif readable.strip():
                        print(f"📄 Content: {readable[:100]}...")
                    
                except:
                    print(f"📦 Raw response received")
                
            except socket.timeout:
                print(f"❌ Timeout - no response")
            except Exception as e:
                print(f"❌ Error: {e}")
            
            time.sleep(0.1)
            
    finally:
        sock.close()
    
    print("\n" + "=" * 60)
    print("🏁 NetApp SNMP Test Complete")

if __name__ == "__main__":
    test_netapp_oids()
