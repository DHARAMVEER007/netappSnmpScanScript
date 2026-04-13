#!/usr/bin/env python3
"""
Analyze why system_object_id is missing from the scan response
"""

def analyze_scan_response():
    """Analyze the scan response and missing sysObjectID"""
    print("🔍 ANALYZING MISSING SYSTEM_OBJECT_ID")
    print("=" * 60)
    
    # The response we got
    scan_response = {
        "Device Location": "Production Data Center - Rack A15",
        "Host Name": "netapp-fas-prod-01", 
        "Asset Name": "netapp-fas-prod-01",
        "Description": "NetApp Release 9.14.1P4: Tue Aug 08 21:32:52 UTC 2023",
        "Device Contact": "netapp-admin@company.com",
        "blueprint": "NetApp Storage Server"
    }
    
    # Expected OID mappings based on values
    oid_mappings = {
        "1.3.6.1.2.1.1.6.0": "Device Location (sysLocation)",
        "1.3.6.1.2.1.1.5.0": "Host Name (sysName)", 
        "1.3.6.1.2.1.1.5.0": "Asset Name (sysName duplicate)",
        "1.3.6.1.2.1.1.1.0": "Description (sysDescr)",
        "1.3.6.1.2.1.1.4.0": "Device Contact (sysContact)",
        "1.3.6.1.2.1.1.2.0": "⚠️  MISSING: system_object_id (sysObjectID)"
    }
    
    print("📋 RECEIVED RESPONSE FIELDS:")
    print("-" * 40)
    for key, value in scan_response.items():
        print(f"✅ {key}: {value}")
    
    print(f"\n📍 LIKELY OID MAPPINGS:")
    print("-" * 40)
    for oid, description in oid_mappings.items():
        if "MISSING" in description:
            print(f"❌ {oid}: {description}")
        else:
            print(f"✅ {oid}: {description}")
    
    print(f"\n🎯 ANALYSIS:")
    print("-" * 20)
    print("✅ SNMP Discovery Tool is WORKING")
    print("   - Successfully connects to 192.168.46.249:161")
    print("   - Gets responses from NetApp emulator")
    print("   - Correctly identifies as 'NetApp Storage Server'")
    print("   - Maps standard system OIDs to response fields")
    
    print(f"\n❌ PROBLEM IDENTIFIED:")
    print("   - Discovery tool is NOT querying sysObjectID (1.3.6.1.2.1.1.2.0)")
    print("   - OR tool is querying it but not including in response")
    print("   - Expected value: 1.3.6.1.4.1.789.2.7")
    
    print(f"\n🔧 POSSIBLE CAUSES:")
    print("   1. Discovery tool OID list doesn't include 1.3.6.1.2.1.1.2.0")
    print("   2. Tool queries it but doesn't map to 'system_object_id' field")
    print("   3. Tool response formatter excludes sysObjectID")
    print("   4. Blueprint configuration missing sysObjectID mapping")
    
    print(f"\n✅ SOLUTIONS:")
    print("   1. Check discovery tool's OID configuration")
    print("   2. Add 1.3.6.1.2.1.1.2.0 to query list")
    print("   3. Verify response field mappings")
    print("   4. Check if 'system_object_id' field is expected")

def create_test_request():
    """Create test to verify sysObjectID is available"""
    print(f"\n🧪 VERIFICATION TEST")
    print("=" * 30)
    print("To confirm sysObjectID is available from emulator:")
    print()
    print("Manual test command:")
    print("  snmpget -v1 -c public 192.168.46.249 1.3.6.1.2.1.1.2.0")
    print()
    print("Expected result:")
    print("  1.3.6.1.2.1.1.2.0 = OID: 1.3.6.1.4.1.789.2.7")
    print()
    print("If this works, the emulator is fine - fix the discovery tool config.")

def suggest_discovery_tool_fix():
    """Suggest how to fix the discovery tool"""
    print(f"\n🛠️  DISCOVERY TOOL CONFIGURATION FIX")
    print("=" * 50)
    print("Your discovery tool needs to:")
    print()
    print("1. **Query sysObjectID OID:**")
    print("   Add '1.3.6.1.2.1.1.2.0' to the OID query list")
    print()
    print("2. **Map response field:**")
    print("   Map 1.3.6.1.2.1.1.2.0 → 'system_object_id' or 'sysObjectID'")
    print()
    print("3. **Include in response:**")
    print("   Ensure the response formatter includes this field")
    print()
    print("4. **Expected result:**")
    print("   Response should include: 'system_object_id': '1.3.6.1.4.1.789.2.7'")
    print()
    print("📋 Check these discovery tool settings:")
    print("   - SNMP OID lists/templates")
    print("   - Response field mappings") 
    print("   - Blueprint configurations")
    print("   - Output formatters")

if __name__ == "__main__":
    analyze_scan_response()
    create_test_request()
    suggest_discovery_tool_fix()
