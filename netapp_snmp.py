import socket
import sys
import logging
import threading
import time

# =========================
# Config - Real NetApp Machine Simulation
# =========================
SNMP_HOST = "0.0.0.0"
SNMP_PORT = 161  # Standard SNMP port
DEVICE_TYPE = "netapp_storage_server"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_real_netapp_responses():
    """Return responses that make this look like a real NetApp storage system"""
    return {
        # Critical System OIDs for discovery
        '1.3.6.1.2.1.1.1.0': b'NetApp Release 9.14.1P4: Tue Aug 08 21:32:52 UTC 2023',
        '1.3.6.1.2.1.1.2.0': b'1.3.6.1.4.1.789.2.7',  # NetApp Storage Server Enterprise OID
        '1.3.6.1.2.1.1.3.0': b'1234567890',  # sysUpTime
        '1.3.6.1.2.1.1.4.0': b'netapp-admin@company.com',  # sysContact
        '1.3.6.1.2.1.1.5.0': b'netapp-fas-prod-01',  # sysName
        '1.3.6.1.2.1.1.6.0': b'Production Data Center - Rack A15',  # sysLocation
        
        # NetApp Product Information (Critical for detection)
        '1.3.6.1.4.1.789.1.1.2.0': b'ONTAP',  # Product Name
        '1.3.6.1.4.1.789.1.1.3.0': b'9.14.1P4',  # Product Version
        '1.3.6.1.4.1.789.1.1.4.0': b'NetApp-FAS8700-87654321',  # Product ID
        '1.3.6.1.4.1.789.1.1.5.0': b'Network Appliance Corporation',  # Product Vendor
        '1.3.6.1.4.1.789.1.1.6.0': b'FAS8700',  # Product Model
        '1.3.6.1.4.1.789.1.1.9.0': b'87654321012',  # System Serial Number
        '1.3.6.1.4.1.789.1.1.25.0': b'production-cluster-dc1',  # Cluster Name
        '1.3.6.1.4.1.789.1.1.26.0': b'netapp-node-01',  # Node Name
        
        # Cluster Information
        '1.3.6.1.4.1.789.1.25.2.1.1': b'f1a2b3c4-d5e6-7890-1234-567890abcdef',  # Cluster UUID
        '1.3.6.1.4.1.789.1.25.2.1.2': b'NetApp Storage Admin <storage@company.com>',  # Cluster Contact
        '1.3.6.1.4.1.789.1.25.2.1.3': b'Production Data Center - Building A - Floor 3',  # Cluster Location
        '1.3.6.1.4.1.789.1.25.2.1.13': b'2',  # Node Count
        
        # Node Information
        '1.3.6.1.4.1.789.1.25.2.1.4': b'FAS8700',  # Node Model
        '1.3.6.1.4.1.789.1.25.2.1.5': b'876543210121',  # Node Serial Number
        '1.3.6.1.4.1.789.1.25.2.1.8': b'8765432100',  # Node Uptime
        '1.3.6.1.4.1.789.1.25.2.1.14': b'normal',  # Node Health
        
        # Performance Counters (Real-looking values)
        '1.3.6.1.4.1.789.1.2.2.1.0': b'15',  # CPU Busy %
        '1.3.6.1.4.1.789.1.2.2.2.0': b'18',  # Total CPU Busy %
        '1.3.6.1.4.1.789.1.2.2.14.0': b'2847',  # NFS Operations
        '1.3.6.1.4.1.789.1.2.2.15.0': b'1293',  # CIFS Operations
        
        # Storage Information - Volumes
        '1.3.6.1.4.1.789.1.5.4.1.2.1': b'vol0',  # Volume Name
        '1.3.6.1.4.1.789.1.5.4.1.29.1': b'107374182400',  # Volume Size (100GB)
        '1.3.6.1.4.1.789.1.5.4.1.30.1': b'42949672960',  # Volume Used (40GB)
        '1.3.6.1.4.1.789.1.5.4.1.31.1': b'64424509440',  # Volume Available (60GB)
        '1.3.6.1.4.1.789.1.5.4.1.5.1': b'online',  # Volume State
        '1.3.6.1.4.1.789.1.5.4.1.23.1': b'rw',  # Volume Type
        '1.3.6.1.4.1.789.1.5.4.1.2.2': b'vol_nfs',  # Volume Name
        '1.3.6.1.4.1.789.1.5.4.1.29.2': b'214748364800',  # Volume Size (200GB)
        '1.3.6.1.4.1.789.1.5.4.1.30.2': b'85899345920',  # Volume Used (80GB)
        '1.3.6.1.4.1.789.1.5.4.1.31.2': b'128849018880',  # Volume Available (120GB)
        '1.3.6.1.4.1.789.1.5.4.1.5.2': b'online',  # Volume State
        '1.3.6.1.4.1.789.1.5.4.1.23.2': b'rw',  # Volume Type
        '1.3.6.1.4.1.789.1.5.4.1.2.3': b'vol_cifs',  # Volume Name
        '1.3.6.1.4.1.789.1.5.4.1.29.3': b'322122547200',  # Volume Size (300GB)
        '1.3.6.1.4.1.789.1.5.4.1.30.3': b'161061273600',  # Volume Used (150GB)
        '1.3.6.1.4.1.789.1.5.4.1.31.3': b'161061273600',  # Volume Available (150GB)
        '1.3.6.1.4.1.789.1.5.4.1.5.3': b'online',  # Volume State
        '1.3.6.1.4.1.789.1.5.4.1.23.3': b'rw',  # Volume Type
        '1.3.6.1.4.1.789.1.5.4.1.2.4': b'lun_vol',  # Volume Name
        '1.3.6.1.4.1.789.1.5.4.1.29.4': b'429496729600',  # Volume Size (400GB)
        '1.3.6.1.4.1.789.1.5.4.1.30.4': b'322122547200',  # Volume Used (300GB)
        '1.3.6.1.4.1.789.1.5.4.1.31.4': b'107374182400',  # Volume Available (100GB)
        '1.3.6.1.4.1.789.1.5.4.1.5.4': b'online',  # Volume State
        '1.3.6.1.4.1.789.1.5.4.1.23.4': b'rw',  # Volume Type
        
        # Network Interface
        '1.3.6.1.4.1.789.1.22.1.2.1.2.1': b'e0a',  # Interface Name
        '1.3.6.1.4.1.789.1.22.1.2.1.3.1': b'192.168.100.50',  # Interface IP
        '1.3.6.1.4.1.789.1.22.1.2.1.4.1': b'255.255.255.0',  # Interface Netmask
        '1.3.6.1.4.1.789.1.22.1.2.1.15.1': b'up',  # Interface Status
        '1.3.6.1.4.1.789.1.22.1.2.1.16.1': b'10000',  # Interface Speed
        
        # HA Status
        '1.3.6.1.4.1.789.1.2.3.1.0': b'connected',  # HA State
        '1.3.6.1.4.1.789.1.2.3.2.0': b'netapp-node-02',  # HA Partner
        '1.3.6.1.4.1.789.1.2.3.4.0': b'true',  # Takeover Possible
        
        # System Health
        '1.3.6.1.4.1.789.1.2.4.1.0': b'false',  # Over Temperature
        '1.3.6.1.4.1.789.1.2.4.2.0': b'false',  # Failed Fan
        '1.3.6.1.4.1.789.1.2.4.3.0': b'false',  # Failed Power Supply
        '1.3.6.1.4.1.789.1.2.4.4.0': b'false',  # Failed Disk
        
        # AutoSupport
        '1.3.6.1.4.1.789.1.2.7.1.0': b'enabled',  # AutoSupport Status
        '1.3.6.1.4.1.789.1.2.7.2.0': b'netapp-node-01',  # AutoSupport Node
        
        # NetApp Aggregates
        '1.3.6.1.4.1.789.1.5.11.1.2.1': b'aggr0',  # Aggregate Name
        '1.3.6.1.4.1.789.1.5.11.1.3.1': b'online',  # Aggregate State
        '1.3.6.1.4.1.789.1.5.11.1.4.1': b'normal',  # Aggregate Status
        '1.3.6.1.4.1.789.1.5.11.1.5.1': b'1099511627776',  # Aggregate Size (1TB)
        '1.3.6.1.4.1.789.1.5.11.1.6.1': b'549755813888',  # Aggregate Used (512GB)
        '1.3.6.1.4.1.789.1.5.11.1.7.1': b'549755813888',  # Aggregate Available (512GB)
        '1.3.6.1.4.1.789.1.5.11.1.2.2': b'aggr1',  # Aggregate Name
        '1.3.6.1.4.1.789.1.5.11.1.3.2': b'online',  # Aggregate State
        '1.3.6.1.4.1.789.1.5.11.1.4.2': b'normal',  # Aggregate Status
        '1.3.6.1.4.1.789.1.5.11.1.5.2': b'2199023255552',  # Aggregate Size (2TB)
        '1.3.6.1.4.1.789.1.5.11.1.6.2': b'1319413953331',  # Aggregate Used (1.2TB)
        '1.3.6.1.4.1.789.1.5.11.1.7.2': b'879609302221',  # Aggregate Available (800GB)
        
        # NetApp VServers (SVMs)
        '1.3.6.1.4.1.789.1.27.1.1.2.1': b'svm-prod-nfs',  # VServer Name
        '1.3.6.1.4.1.789.1.27.1.1.3.1': b'running',  # VServer State
        '1.3.6.1.4.1.789.1.27.1.1.4.1': b'data',  # VServer Type
        '1.3.6.1.4.1.789.1.27.1.1.5.1': b'12345678-abcd-ef12-3456-789012345678',  # VServer UUID
        '1.3.6.1.4.1.789.1.27.1.1.2.2': b'svm-prod-cifs',  # VServer Name
        '1.3.6.1.4.1.789.1.27.1.1.3.2': b'running',  # VServer State
        '1.3.6.1.4.1.789.1.27.1.1.4.2': b'data',  # VServer Type
        '1.3.6.1.4.1.789.1.27.1.1.5.2': b'87654321-dcba-21fe-6543-210987654321',  # VServer UUID
        '1.3.6.1.4.1.789.1.27.1.1.2.3': b'svm-prod-iscsi',  # VServer Name
        '1.3.6.1.4.1.789.1.27.1.1.3.3': b'running',  # VServer State
        '1.3.6.1.4.1.789.1.27.1.1.4.3': b'data',  # VServer Type
        '1.3.6.1.4.1.789.1.27.1.1.5.3': b'11223344-5566-7788-9900-aabbccddeeff',  # VServer UUID
        
        # NetApp LUNs
        '1.3.6.1.4.1.789.1.17.15.1.2.1': b'/vol/lun_vol/database_lun',  # LUN Name
        '1.3.6.1.4.1.789.1.17.15.1.3.1': b'214748364800',  # LUN Size (200GB)
        '1.3.6.1.4.1.789.1.17.15.1.4.1': b'online',  # LUN State
        '1.3.6.1.4.1.789.1.17.15.1.6.1': b'LUN001234567890',  # LUN Serial Number
        '1.3.6.1.4.1.789.1.17.15.1.2.2': b'/vol/lun_vol/vmware_lun',  # LUN Name
        '1.3.6.1.4.1.789.1.17.15.1.3.2': b'107374182400',  # LUN Size (100GB)
        '1.3.6.1.4.1.789.1.17.15.1.4.2': b'online',  # LUN State
        '1.3.6.1.4.1.789.1.17.15.1.6.2': b'LUN001234567891',  # LUN Serial Number
        
        # NetApp Snapshots
        '1.3.6.1.4.1.789.1.5.5.1.2.1': b'hourly.2024-01-15_1200',  # Snapshot Name
        '1.3.6.1.4.1.789.1.5.5.1.6.1': b'1073741824',  # Snapshot Size (1GB)
        '1.3.6.1.4.1.789.1.5.5.1.7.1': b'1705320000',  # Snapshot Created (timestamp)
        '1.3.6.1.4.1.789.1.5.5.1.2.2': b'daily.2024-01-15_0000',  # Snapshot Name
        '1.3.6.1.4.1.789.1.5.5.1.6.2': b'5368709120',  # Snapshot Size (5GB)
        '1.3.6.1.4.1.789.1.5.5.1.7.2': b'1705276800',  # Snapshot Created (timestamp)
        '1.3.6.1.4.1.789.1.5.5.1.2.3': b'weekly.2024-01-14_0000',  # Snapshot Name
        '1.3.6.1.4.1.789.1.5.5.1.6.3': b'10737418240',  # Snapshot Size (10GB)
        '1.3.6.1.4.1.789.1.5.5.1.7.3': b'1705190400',  # Snapshot Created (timestamp)
        
        # NetApp Disks
        '1.3.6.1.4.1.789.1.6.4.1.2.1': b'1a.00.0',  # Disk Name
        '1.3.6.1.4.1.789.1.6.4.1.3.1': b'SSD',  # Disk Type
        '1.3.6.1.4.1.789.1.6.4.1.5.1': b'960197124096',  # Disk Size (894GB)
        '1.3.6.1.4.1.789.1.6.4.1.6.1': b'0',  # Disk RPM (SSD)
        '1.3.6.1.4.1.789.1.6.4.1.9.1': b'NETAPP',  # Disk Vendor
        '1.3.6.1.4.1.789.1.6.4.1.10.1': b'X422_HCOBD960A10',  # Disk Model
        '1.3.6.1.4.1.789.1.6.4.1.11.1': b'S464NX0M123456',  # Disk Serial Number
        '1.3.6.1.4.1.789.1.6.4.1.2.2': b'1a.00.1',  # Disk Name
        '1.3.6.1.4.1.789.1.6.4.1.3.2': b'SSD',  # Disk Type
        '1.3.6.1.4.1.789.1.6.4.1.5.2': b'960197124096',  # Disk Size (894GB)
        '1.3.6.1.4.1.789.1.6.4.1.6.2': b'0',  # Disk RPM (SSD)
        '1.3.6.1.4.1.789.1.6.4.1.9.2': b'NETAPP',  # Disk Vendor
        '1.3.6.1.4.1.789.1.6.4.1.10.2': b'X422_HCOBD960A10',  # Disk Model
        '1.3.6.1.4.1.789.1.6.4.1.11.2': b'S464NX0M123457',  # Disk Serial Number
        '1.3.6.1.4.1.789.1.6.4.1.2.3': b'1b.00.0',  # Disk Name
        '1.3.6.1.4.1.789.1.6.4.1.3.3': b'SAS',  # Disk Type
        '1.3.6.1.4.1.789.1.6.4.1.5.3': b'10995116277760',  # Disk Size (10TB)
        '1.3.6.1.4.1.789.1.6.4.1.6.3': b'7200',  # Disk RPM
        '1.3.6.1.4.1.789.1.6.4.1.9.3': b'NETAPP',  # Disk Vendor
        '1.3.6.1.4.1.789.1.6.4.1.10.3': b'X576_PHM2T10',  # Disk Model
        '1.3.6.1.4.1.789.1.6.4.1.11.3': b'S464NX0M123458',  # Disk Serial Number
        
        # NetApp Ports (FC/iSCSI)
        '1.3.6.1.4.1.789.1.17.20.1.2.1': b'0a',  # Port Name
        '1.3.6.1.4.1.789.1.17.20.1.3.1': b'fibre-channel',  # Port Type
        '1.3.6.1.4.1.789.1.17.20.1.4.1': b'32000000000',  # Port Speed (32Gb)
        '1.3.6.1.4.1.789.1.17.20.1.5.1': b'online',  # Port State
        '1.3.6.1.4.1.789.1.17.20.1.6.1': b'50:0a:09:80:86:67:12:34',  # Port WWPN
        '1.3.6.1.4.1.789.1.17.20.1.2.2': b'0b',  # Port Name
        '1.3.6.1.4.1.789.1.17.20.1.3.2': b'fibre-channel',  # Port Type
        '1.3.6.1.4.1.789.1.17.20.1.4.2': b'32000000000',  # Port Speed (32Gb)
        '1.3.6.1.4.1.789.1.17.20.1.5.2': b'online',  # Port State
        '1.3.6.1.4.1.789.1.17.20.1.6.2': b'50:0a:09:80:86:67:12:35',  # Port WWPN
        '1.3.6.1.4.1.789.1.17.20.1.2.3': b'e0e',  # Port Name
        '1.3.6.1.4.1.789.1.17.20.1.3.3': b'ethernet',  # Port Type
        '1.3.6.1.4.1.789.1.17.20.1.4.3': b'10000000000',  # Port Speed (10Gb)
        '1.3.6.1.4.1.789.1.17.20.1.5.3': b'online',  # Port State
        '1.3.6.1.4.1.789.1.17.20.1.6.3': b'N/A',  # Port WWPN (N/A for Ethernet)
        
        # NetApp Qtrees
        '1.3.6.1.4.1.789.1.4.6.1.2.1': b'qtree1',  # Qtree Name
        '1.3.6.1.4.1.789.1.4.6.1.3.1': b'vol0',  # Qtree Volume
        '1.3.6.1.4.1.789.1.4.6.1.4.1': b'unix',  # Qtree Security
        '1.3.6.1.4.1.789.1.4.6.1.2.2': b'qtree_nfs',  # Qtree Name
        '1.3.6.1.4.1.789.1.4.6.1.3.2': b'vol_nfs',  # Qtree Volume
        '1.3.6.1.4.1.789.1.4.6.1.4.2': b'unix',  # Qtree Security
        '1.3.6.1.4.1.789.1.4.6.1.2.3': b'qtree_cifs',  # Qtree Name
        '1.3.6.1.4.1.789.1.4.6.1.3.3': b'vol_cifs',  # Qtree Volume
        '1.3.6.1.4.1.789.1.4.6.1.4.3': b'ntfs',  # Qtree Security
        
        # NetApp Storage Efficiency
        '1.3.6.1.4.1.789.1.26.1.1.3.1': b'enabled',  # Compression Enabled
        '1.3.6.1.4.1.789.1.26.1.1.4.1': b'enabled',  # Deduplication Enabled
        '1.3.6.1.4.1.789.1.26.1.1.5.1': b'42949672960',  # Space Saved (40GB)
        '1.3.6.1.4.1.789.1.26.1.1.3.2': b'enabled',  # Compression Enabled
        '1.3.6.1.4.1.789.1.26.1.1.4.2': b'enabled',  # Deduplication Enabled
        '1.3.6.1.4.1.789.1.26.1.1.5.2': b'32212254720',  # Space Saved (30GB)
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
    """Handle SNMP request like a real NetApp device"""
    try:
        oid, request_id = parse_snmp_request(data)
        
        if oid:
            logger.info(f"SNMP GET from {addr[0]}:{addr[1]} - OID: {oid}")
            
            responses = get_real_netapp_responses()
            
            if oid in responses:
                response_value = responses[oid]
                logger.info(f"✓ NetApp Response: {response_value.decode('utf-8', errors='ignore')[:60]}...")
                response = create_snmp_response(request_id, oid, response_value)
                sock.sendto(response, addr)
            else:
                # Check for partial matches (indexed OIDs)
                found = False
                for known_oid in responses:
                    if oid.startswith(known_oid.rsplit('.', 1)[0]):
                        response_value = responses[known_oid]
                        logger.info(f"✓ NetApp Pattern Match: {response_value.decode('utf-8', errors='ignore')[:60]}...")
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

def start_real_netapp_emulator():
    """Start NetApp emulator on port 161"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((SNMP_HOST, SNMP_PORT))
        
        print("=" * 80)
        print("🖥️  COMPREHENSIVE NetApp ONTAP Storage System Emulator")
        print("=" * 80)
        print(f"📡 SNMP Agent: {SNMP_HOST}:{SNMP_PORT}")
        print(f"🏷️  Enterprise OID: 1.3.6.1.4.1.789.2.7 (NetApp Storage Server)")
        print(f"💾 System: NetApp Release 9.14.1P4 FAS8700")
        print(f"🔗 Cluster: production-cluster-dc1 (2 nodes)")
        print(f"📍 Location: Production Data Center - Rack A15")
        print()
        print("📊 SIMULATED COMPONENTS:")
        print("   ✓ System Information & Product Details")
        print("   ✓ Cluster & Node Information")
        print("   ✓ Aggregates (aggr0: 1TB, aggr1: 2TB)")
        print("   ✓ VServers/SVMs (NFS, CIFS, iSCSI)")
        print("   ✓ Volumes & Storage (4 volumes: 100GB-400GB)")
        print("   ✓ LUNs (Database: 200GB, VMware: 100GB)")
        print("   ✓ Snapshots (hourly, daily, weekly)")
        print("   ✓ Disks (3 disks: 2xSSD, 1xSAS)")
        print("   ✓ Network Interfaces & Ports (FC, Ethernet)")
        print("   ✓ Qtrees with Security Settings")
        print("   ✓ Storage Efficiency (Compression/Dedup)")
        print("   ✓ Performance Counters (CPU, NFS, CIFS)")
        print("   ✓ High Availability Status")
        print("   ✓ System Health Monitoring")
        print("   ✓ AutoSupport Configuration")
        print("=" * 80)
        print("✅ Ready for comprehensive discovery - 150+ NetApp OIDs supported")
        print("🛑 Press Ctrl+C to stop")
        print("=" * 80)
        
        logger.info("NetApp SNMP emulator started - ready for discovery")
        
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
        print("   Then run: py netapp_snmp_real.py")
        return False
    except OSError as e:
        if "Address already in use" in str(e):
            print("❌ ERROR: Port 161 already in use")
            print("🔧 Solution: Stop other SNMP services or use different port")
        else:
            print(f"❌ ERROR: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 NetApp SNMP Emulator stopped")
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
    print("Starting NetApp Storage System Emulator...")
    print("This will simulate a real NetApp FAS8700 storage system")
    print()
    
    success = start_real_netapp_emulator()
    if not success:
        input("Press Enter to exit...")
        sys.exit(1)
