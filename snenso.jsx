
importPackage(Packages.org.apache.commons.httpclient);
importPackage(Packages.org.apache.commons.httpclient.methods);
// Add Jackson imports for main function
importPackage(Packages.com.fasterxml.jackson.databind);
importPackage(Packages.com.fasterxml.jackson.databind.node);
importPackage(Packages.com.google.gson);

function main(inputDataFileName, probeId, scanId, EMWebServiceEndPoint, clientSessionId, groupProbeId) {

	load(com.virima.utils.CommonUtils.getDiscoveryServerHome() + '/helperfiles/js/jsapi.js');

	print("inputDataFileName = " + inputDataFileName);
	var data = readFile(inputDataFileName);
	print('probeId = ' + probeId);
	print('scanId = ' + scanId);
	print('EMWebServiceEndPoint = ' + EMWebServiceEndPoint);
	print('clientSessionId = ' + clientSessionId);
	print('groupProbeId = ' + groupProbeId);
	print('data from agent = '+ data);
	var output = "";

	// Create Jackson ObjectMapper
	var mapper = new ObjectMapper();

	//From the output findout whether it is a windows machine or other network devices, we can check for system object id
	var oidValuesJSON = mapper.readTree(data);
	var systemObjectID = oidValuesJSON.get("1.3.6.1.2.1.1.2.0") != null ? oidValuesJSON.get("1.3.6.1.2.1.1.2.0").asText() : null;
	var isWindows = false;
	var isLinux = false;
	var isF5 = false;
	var isNetscalar = false;
	if (systemObjectID != null) {
		var enterpriseID = getEntepriseIDFromSystemObjectID(systemObjectID);
		print("enterpriseID : " + enterpriseID);
		if (enterpriseID == "311")
			isWindows = true;
		if (enterpriseID == "8072" || enterpriseID == "42")
			isLinux = true;
		if(enterpriseID == "3375")
			isF5 = true;
		if (enterpriseID == "5951")
			isNetscalar = true;
	}

	if (isWindows) {
		print("From SNMP details, device detected as WINDOWS MACHINE");
		output = snmpSensorForWindows(data);
	} else {
		print("From SNMP details, device detected as NETWORK DEVICE");
		if (isLinux) {
			output = snmpSensorForLinux(data);
		}else if(isF5){
			output = snmpSensorForF5(data);
		}else if(isNetscalar){
			output = snmpSensorForNetscalar(data);
		}else {
			output = snmpSensorForNonWindows(data);
		}
	}
	//to remove empty values
	var json_obj = mapper.readTree(output);
	var output_edited = "";
	var status= "false";
	var fieldsIterator = json_obj.fieldNames();
	while(fieldsIterator.hasNext()) {
	    var key = fieldsIterator.next();
	    if(json_obj.get(key) != null && json_obj.get(key).isTextual() && json_obj.get(key).asText() == "") {
	        // Create a temporary object from the original
	        var tempObj = mapper.readTree(output);
	        // Remove the empty field
	        var objectNode = tempObj;
	        objectNode.remove(key);
	        // Convert back to string
	        output_edited = tempObj.toString();
	        status = "true";
	    }
	}

	print('data from output = '+ output);
	print('data from output_edited = '+ output_edited);
	if(status =="false")
		return output;
	else
    	return output_edited;
}

print("\nSensor execution completed");

function snmpSensorForLinux(data) {
    print("data "+data);
	// Create Jackson ObjectMapper
	var mapper = new ObjectMapper();
	var jsonObject = mapper.readTree(data);
	var jsonProp = OIDtoPropertyMapping();

	// Get field names using iterator
	var oids = [];
	var fieldsIterator = jsonObject.fieldNames();
	while(fieldsIterator.hasNext()) {
		oids.push(fieldsIterator.next());
	}

	var propArray = Object.keys(jsonProp);
	var result = mapper.createObjectNode();

	var storageUsed = new java.util.HashMap(),
	storageType = new java.util.HashMap(),
	storageKind = new java.util.HashMap(),
	storageIndex = new java.util.HashMap(),
	storageMount = new java.util.HashMap(),
	storageSize = new java.util.HashMap(),
	storageLabels = new java.util.HashMap(),
	storageAllocationUnit = new java.util.HashMap();
	var softwareIndex = new java.util.HashMap(),
	softwareName = new java.util.HashMap(),
	softwareType = new java.util.HashMap(),
	softwareInstall = new java.util.HashMap();
	var processName = new java.util.HashMap(),
	processIndex = new java.util.HashMap(),
	processCommand = new java.util.HashMap(),
	processArguments = new java.util.HashMap();

	var networkSpeed = new java.util.HashMap(),
	networkIpAddress = new java.util.HashMap(),
	networkIndex = new java.util.HashMap(),
	networkName = new java.util.HashMap(),
	networkMask = new java.util.HashMap(),
	networkIfIndex = new java.util.HashMap(),
	networkPhysAddress = new java.util.HashMap();

	var tcpConnState = new java.util.HashMap(),
	tcpLocalAddress = new java.util.HashMap(),
	tcpLocalPort = new java.util.HashMap(),
	tcpRemoteAddress = new java.util.HashMap(),
	tcpRemotePort = new java.util.HashMap();

	var deviceType = new java.util.HashMap(),
	deviceDescription = new java.util.HashMap();

	var twoDec = new java.text.DecimalFormat("##.##");

	var keyArray = oids;
	var keySize = keyArray.length;

	var propSize = propArray.length;

	for (var key = 0; key < keySize; key++) {

		for (var propKey = 0; propKey < propSize; propKey++) {
			if (keyArray[key].equals(propArray[propKey])) {
				var keyAsDescription = jsonProp[propArray[propKey]];
				var obj = jsonObject.get(keyArray[key]);

				if (obj != null && obj.isTextual()) {

					try {
						var value = jsonObject.get(keyArray[key]).asText();
						var isJSON = checkValidJSON(value);
						var array = [];
						if (isJSON) {
							var hashMap = new java.util.HashMap();
							var testObj = mapper.readTree(value);
							var subKeysIterator = testObj.fieldNames();
							while (subKeysIterator.hasNext()) {
								var oid = subKeysIterator.next();
								var value = testObj.get(oid).asText();
								var rootOID = keyArray[key];
								oid = oid.replaceAll(rootOID + ".", "");
								hashMap.put(oid, value);
							}
							print("keyAsDescription"+keyAsDescription );

							if (keyAsDescription.equals("Storage Index")) {
								storageIndex = hashMap;
							}
							if (keyAsDescription.equals("FS Type")) {
								storageType = hashMap;
							}
							if (keyAsDescription.equals("Storage Labels")) {
								storageLabels = hashMap;
							}
							if (keyAsDescription.equals("Storage Size")) {
								storageSize = hashMap;
							}
							if (keyAsDescription.equals("Storage Used")) {
								storageUsed = hashMap;
							}
							if (keyAsDescription.equals("Storage Allocation Unit")) {
								storageAllocationUnit = hashMap;
							}
							if (keyAsDescription.equals("Software Index")) {
								softwareIndex = hashMap;
							}
							if (keyAsDescription.equals("Software Type")) {
								softwareType = hashMap;
							}
							if (keyAsDescription.equals("Software Name")) {
								softwareName = hashMap;
							}
							if (keyAsDescription.equals("Software Install Date")) {
								softwareInstall = hashMap;
							}
							if (keyAsDescription.equals("Process Name")) {
								processName = hashMap;
							}
							if (keyAsDescription.equals("Process Index")) {
								processIndex = hashMap;
							}
							if (keyAsDescription.equals("Process Command")) {
								processCommand = hashMap;
							}
							if (keyAsDescription.equals("TCP Connection State")) {
								tcpConnState = hashMap;
							}
							if (keyAsDescription.equals("TCP Local Address")) {
								tcpLocalAddress = hashMap;
							}
							if (keyAsDescription.equals("TCP Local Port")) {
								tcpLocalPort = hashMap;
							}
							if (keyAsDescription.equals("TCP Remote Address")) {
								tcpRemoteAddress = hashMap;
							}
							if (keyAsDescription.equals("TCP Remote Port")) {
								tcpRemotePort = hashMap;
							}
							if (keyAsDescription.equals("Process Arguments")) {
								processArguments = hashMap;
							}
							if (keyAsDescription.equals("Process Index")) {
								processIndex = hashMap;
							}
							if (keyAsDescription.equals("Storage Type")) {
								storageKind = hashMap;
							}
							if (keyAsDescription.equals("Mount Point")) {
								storageMount = hashMap;
							}
							if (keyAsDescription.equals("Network Speed")) {
								networkSpeed = hashMap;
							}
							if (keyAsDescription.equals("Network ifIndex")) {
								networkIndex = hashMap;
							}
							if (keyAsDescription.equals("Network Adapter Name")) {
								networkName = hashMap;
							}
							if (keyAsDescription.equals("IP Address")) {
								networkIpAddress = hashMap;
							}
							if (keyAsDescription.equals("Netmask")) {
								networkMask = hashMap;
							}
							if (keyAsDescription.equals("Interface Physical Address")) {
								networkPhysAddress = hashMap;
							}
							if (keyAsDescription.equals("IP Interface Index")) {
								networkIfIndex = hashMap;
							}
							if (keyAsDescription.equals("Device Type")) {
								deviceType = hashMap;
							}
							if (keyAsDescription.equals("Device Description")) {
								deviceDescription = hashMap;
							}
						} else {

							if (keyAsDescription.equals("RAM(MB)")) {
								if (value != "") {
									var ramLong = java.lang.Double.parseDouble(value);
									var ram = java.lang.Double.valueOf(twoDec.format(ramLong / 1024));
									value = ram;
								}
								result.put(keyAsDescription, value.toString());
							} else if (keyAsDescription.equals("OS Local Date Time")) {
								result.put(keyAsDescription, "");
							} else if (keyAsDescription.equals("Uptime")) {
								var s = value.split(",");
								value = s[0].trim();
								result.put(keyAsDescription, value);
							} else {
								result.put(keyAsDescription, value);
							}

						}
					} catch (e) {
						e.rhinoException.printStackTrace();
					}
				}
				// No handling for JSONArray here as it wasn't in the original function
			}
		}
	}

	var jsonArray = mapper.createArrayNode();
	var keys = storageUsed.keySet();
	var itr = keys.iterator();
	while (itr.hasNext()) {
		var key = itr.next();
		var json = mapper.createObjectNode();

		var diskSize = 0.0,
		diskFree = 0.0,
		diskUsed = 0.0,
		diskUsedPercentage = 0.0,
		diskFreePercentage = 0.0;
		var diskName = null,
		mountPoint = null,
		serialNumber = null,
		diskType = null,
		diskKind = null;
		try { //generate desired outputs
			var storageUsedInt = java.lang.Long.parseLong(storageUsed.get(key));
			var allocationUnitInt = java.lang.Long.parseLong(storageAllocationUnit.get(key));
			var storageSizeInt = java.lang.Long.parseLong(storageSize.get(key));

			var storgKind = new java.util.HashMap();

			storgKind.put("1.3.6.1.2.1.25.2.1.4", "Fixed Disk");
			storgKind.put("1.3.6.1.2.1.25.2.1.7", "Compact Disk");
			storgKind.put("1.3.6.1.2.1.25.2.1.3", "Virtual Memory");
			storgKind.put("1.3.6.1.2.1.25.2.1.2", "RAM");
			storgKind.put("1.3.6.1.2.1.25.2.1.5", "Removable Disk");
			storgKind.put("1.3.6.1.2.1.25.2.1.1", "Other");

			var oid = storageKind.get(key);
			var keys = storgKind.keySet();
			var it1 = keys.iterator();
			while (it1.hasNext()) {
				var key1 = it1.next();
				if (oid == key1) {
					diskKind = storgKind.get(oid);
				}
			}
			var storgType = new java.util.HashMap();

			storgType.put("1.3.6.1.2.1.25.3.9.9", "NTFS");
			storgType.put("1.3.6.1.2.1.25.3.9.5", "FAT");
			storgType.put("1.3.6.1.2.1.25.3.9.23", "EXT2");
			storgType.put("1.3.6.1.2.1.25.3.9.1", "Other");

			var oidType = storageType.get(key);
			var keysType = storgType.keySet();
			var it2 = keysType.iterator();
			while (it2.hasNext()) {
				var key2 = it2.next();
				if (oidType == key2) {
					diskType = storgType.get(oidType);
				}
			}
			var name = storageLabels.get(key);
			if (name.contains("Serial Number")) {
				var arr = name.split("Serial Number");
				var arr1 = name.split(":");
				diskName = arr1[0];
				serialNumber = arr[1];
			} else {
				serialNumber = "";
				name = name.replaceAll("[:\\\\]", "");
				diskName = name;
			}

			diskSize = (storageSizeInt * allocationUnitInt) / 1024.0 / 1024.0 / 1024.0;
			diskUsed = (storageUsedInt * allocationUnitInt) / 1024.0 / 1024.0 / 1024.0;
			if (twoDec.format(diskSize) != 0.0) {
				diskFree = diskSize - diskUsed;
				diskUsedPercentage = twoDec.format((diskUsed / diskSize) * 100);
				diskFreePercentage = twoDec.format((diskFree / diskSize) * 100);
				diskFree = twoDec.format(diskFree);
			} else {
				diskFreePercentage = 0.0;
				diskUsedPercentage = 0.0;
				diskFree = 0.0;
			}
			diskSize = twoDec.format(diskSize);
			diskUsed = twoDec.format(diskUsed);

		} catch (e) {
			e.rhinoException.printStackTrace();
		}

		if (!(diskName.toLowerCase().equals("virtual memory")) && !(diskName.toLowerCase().equals("physical memory"))) {
			json.put("Disk Used Percentage", diskUsedPercentage + "%");
			json.put("Disk Size(GB)", diskSize + " GB");
			if (diskKind == null)
				diskKind = "";
			json.put("Disk Kind", diskKind);
			if (diskType == null)
				diskType = "";
			json.put("Disk Type", diskType);
			var MountPoint = storageMount.get(key);
			if (MountPoint == null)
				MountPoint = "";
			json.put("Mount Point", MountPoint);
			json.put("Disk Used Space(GB)", diskUsed + " GB");
			json.put("Free Disk Space(GB)", diskFree + " GB");
			json.put("Disk Free Percentage", diskFreePercentage + "%");
			json.put("id", storageIndex.get(key) != null ? storageIndex.get(key) : "");
			json.put("Disk Name", diskName + ":");
			jsonArray.add(json);
		}

	}
	result.set("Storage Disk", jsonArray);
	//-------------------------------

	var xIp = new java.util.HashMap();
	var yMask = new java.util.HashMap();
	var key7 = networkIfIndex.keySet();
	var it7 = key7.iterator();
	while (it7.hasNext()) {
		var key = it7.next();
		var key2 = networkIpAddress.keySet();
		var it2 = key2.iterator();
		while (it2.hasNext()) {
			var duk = it2.next();
			if (key == duk) {
				xIp.put(networkIfIndex.get(key), networkIpAddress.get(duk));
				yMask.put(networkIfIndex.get(key), networkMask.get(duk));
			}
		}
	}
	var jsonArray2 = mapper.createArrayNode();
	var keys = xIp.keySet();
	var itr = keys.iterator();
	while (itr.hasNext()) {
		var key = itr.next();
		var json = mapper.createObjectNode();
		//converting naSpeed from bps to Mbps
		if(isNaN(networkSpeed.get(key)))
			json.put("Network Speed", networkSpeed.get(key));
		else
			json.put("Network Speed", networkSpeed.get(key)/1000000);
		json.put("IP Address", xIp.get(key));
		json.put("Network ifIndex", networkIndex.get(key) != null ? networkIndex.get(key) : "");
		json.put("Network Adapter Duplex", "");
		json.put("Network Adapter Name", networkName.get(key) != null ? networkName.get(key) : "");
		json.put("Netmask", yMask.get(key));
		json.put("Default Gateway", "");
		json.put("MAC Address", networkPhysAddress.get(key) != null ? networkPhysAddress.get(key) : "");
		json.put("Broadcast Address", "");
		jsonArray2.add(json);
	}
	result.set("Network Adapter", jsonArray2);
	//-----------------------------------
	var jsonArray1 = mapper.createArrayNode();
	var keys = softwareIndex.keySet();
	var itr = keys.iterator();
	while (itr.hasNext()) {
		var key = itr.next();
		var json = mapper.createObjectNode();
		json.put("Package Version", "");
		json.put("Package Name", softwareName.get(key) != null ? softwareName.get(key) : "");
		json.put("Package Install Location", "");
		json.put("Package Publisher", "");
		//json.put("Package Install Date", softwareInstall.get(key)); //Invalid Date data recieved from (SNMP4J.jar) library so currently not using.
		json.put("Package Install Date", "");
		jsonArray1.add(json);
	}
	result.set("Package", jsonArray1);
	//----------------------------------------
	result.put("blueprint", "Unix Server");
	if (result.has("Device Name"))
		result.put("Host Name", result.get("Device Name").asText());
	//---------------------------------------
	var jsonProcessArray = mapper.createArrayNode();
	var keys = processName.keySet();
	var itr = keys.iterator();
	var l = 0;
	while (itr.hasNext()) {
		var key = itr.next();
		var json = mapper.createObjectNode();
		json.put("User Id", "");
		json.put("Command", processCommand.get(key) != null ? processCommand.get(key) : "");
		json.put("PID", processIndex.get(key));
		l = l+1;
		json.put("id", l+"");
		json.put("PPID", "");
		json.put("Process Name", processName.get(key));
		json.put("Started On(at)", "");
		json.put("Process Arguments", processArguments.get(key) != null ? processArguments.get(key) : "");
		jsonProcessArray.add(json);
	}
	result.set("Process", jsonProcessArray);

	// --- IP Connections - Linux - Start ---
	var jsonIpsArray = mapper.createArrayNode();

    	// Get all unique connection indices from any of the TCP connection maps
		var allKeys = new java.util.HashSet();
		if (tcpConnState.keySet().size() > 0) {
			allKeys.addAll(tcpConnState.keySet());
		}
		if (tcpLocalAddress.keySet().size() > 0) {
			allKeys.addAll(tcpLocalAddress.keySet());
		}
		if (tcpLocalPort.keySet().size() > 0) {
			allKeys.addAll(tcpLocalPort.keySet());
		}
		if (tcpRemoteAddress.keySet().size() > 0) {
			allKeys.addAll(tcpRemoteAddress.keySet());
		}
		if (tcpRemotePort.keySet().size() > 0) {
			allKeys.addAll(tcpRemotePort.keySet());
		}

		var keys = allKeys.iterator();
		while (keys.hasNext()) {
			var connectionIndex = keys.next();

			// Extract data from individual OID maps using the connection index
			var localIPAddress = tcpLocalAddress.get(connectionIndex) || "0.0.0.0";
			var localPort = tcpLocalPort.get(connectionIndex) || "0";
			var remoteIPAddress = tcpRemoteAddress.get(connectionIndex) || "0.0.0.0";
			var remotePort = tcpRemotePort.get(connectionIndex) || "0";
			var connectionState = tcpConnState.get(connectionIndex) || "1";

			// Map connection state numbers to readable values
			var stateMap = {
				"1": "CLOSED",
				"2": "LISTEN",
				"3": "SYN_SENT",
				"4": "SYN_RECEIVED",
				"5": "ESTABLISHED",
				"6": "FIN_WAIT_1",
				"7": "FIN_WAIT_2",
				"8": "CLOSE_WAIT",
				"9": "LAST_ACK",
				"10": "CLOSING",
				"11": "TIME_WAIT"
			};

			var stateDescription = stateMap[connectionState] || "UNKNOWN";

			// Create JSON object with the extracted values
			var ipJson = mapper.createObjectNode();
			ipJson.put("Local IP Address", localIPAddress);
			ipJson.put("Local Port", localPort);
			ipJson.put("Remote IP Address", remoteIPAddress);
			ipJson.put("Remote Port", remotePort);
			ipJson.put("Protocol", "TCP");
			ipJson.put("State", stateDescription);
			jsonIpsArray.add(ipJson);
		}

	result.set("IP Connections", jsonIpsArray);

	// --- IP Connections - Linux - End ---

	//-----------------------------------------
	/*var keys = deviceType.keySet();
	var itr = keys.iterator();
	while (itr.hasNext()) {
		var key = itr.next();
		if (deviceType.get(key) == "1.3.6.1.2.1.25.3.1.3") {
			var extract = key.replaceAll("1.3.6.1.2.1.25.3.2.1.2.", "");
			var subKeys = deviceDescription.keySet();
			var subItr = subKeys.iterator();
			while (subItr.hasNext()) {
				var subKey = subItr.next();
				if (subKey.indexOf(extract) != -1) {
					result.put("CPU Type", deviceDescription.get(subKey));
				}
			}
		}
	}

	// Create separate arrays for USB devices and monitors
	var usbDevicesArray = mapper.createArrayNode();
	var monitorsArray = mapper.createArrayNode();
	var mainDeviceArray = mapper.createArrayNode();

	var deviceTypeKeys = deviceType.keySet();
	var deviceItr = deviceTypeKeys.iterator();
	while (deviceItr.hasNext()) {
		var deviceKey = deviceItr.next();
		var deviceJson = mapper.createObjectNode();
		var typeValue = deviceType.get(deviceKey);
		var deviceDesc = deviceDescription.get(deviceKey) || "";
		var deviceId = deviceKey.split("\\.").pop();
		
		// Determine if it's a USB device
		var isUSB = deviceDesc.toLowerCase().match(/usb|hid|human interface|universal serial bus/) !== null;
		
		// Determine if it's a monitor/display
		var isMonitor = (typeValue == "1.3.6.1.2.1.25.3.1.16" || // Display
						 typeValue == "1.3.6.1.2.1.25.3.1.19");  // Video
		
		// Only process USB and monitor devices
		if (isUSB || isMonitor) {
			deviceJson.put("Device ID", deviceId);
			deviceJson.put("Device Description", deviceDesc);
			
			if (isUSB) {
				deviceJson.put("Device Type", "USB");
				usbDevicesArray.add(deviceJson);
				mainDeviceArray.add(deviceJson);
			} 
			else if (isMonitor) {
				deviceJson.put("Device Type", "Monitor");
				monitorsArray.add(deviceJson);
				mainDeviceArray.add(deviceJson);
			}
		}
	}

	// Add separate collections to match the PowerShell sensor format
	if (usbDevicesArray.size() > 0) {
		result.set("USB Devices", usbDevicesArray);
	}
	if (monitorsArray.size() > 0) {
		result.set("Monitors", monitorsArray);
	}

	// Add the main collection of all peripheral devices
	result.set("Peripheral Device", mainDeviceArray);*/

	// Function to map device types
	function mapDeviceType(typeOid) {
		var map = {
			"1.3.6.1.2.1.25.3.1.1": "Other",
			"1.3.6.1.2.1.25.3.1.2": "Unknown",
			"1.3.6.1.2.1.25.3.1.3": "Processor",
			"1.3.6.1.2.1.25.3.1.4": "Network Interface",
			"1.3.6.1.2.1.25.3.1.5": "Printer",
			"1.3.6.1.2.1.25.3.1.6": "Disk Storage",
			"1.3.6.1.2.1.25.3.1.7": "Tape Storage",
			"1.3.6.1.2.1.25.3.1.8": "Other Storage",
			"1.3.6.1.2.1.25.3.1.9": "Serial Port",
			"1.3.6.1.2.1.25.3.1.10": "Parallel Port",
			"1.3.6.1.2.1.25.3.1.11": "Modem",
			"1.3.6.1.2.1.25.3.1.12": "Clock",
			"1.3.6.1.2.1.25.3.1.13": "Keyboard",
			"1.3.6.1.2.1.25.3.1.14": "Pointing Device",
			"1.3.6.1.2.1.25.3.1.15": "Network Interface",
			"1.3.6.1.2.1.25.3.1.16": "Display",
			"1.3.6.1.2.1.25.3.1.17": "Audio",
			"1.3.6.1.2.1.25.3.1.18": "Coprocessor",
			"1.3.6.1.2.1.25.3.1.19": "Video",
			"1.3.6.1.2.1.25.3.1.20": "Multimedia",
			"1.3.6.1.2.1.25.3.1.21": "Mass Storage",
			"1.3.6.1.2.1.25.3.1.22": "System Bus"
		};
		return map[typeOid] || "Unknown";
	}

	return result.toString();
}

function snmpSensorForNonWindows(data) {
try{
    print("=== STARTING snmpSensorForNonWindows ===");
    print("Input data: " + data);
    
    var finalJSON = new java.util.HashMap();
    // Create Jackson ObjectMapper
    var mapper = new ObjectMapper();
    var finalRequestJSON = mapper.createObjectNode();

    // data contains the oid to value map in json format
    // go through each oid, get its corresponding human name and populate the request json
    var oidValuesJSON = mapper.readTree(data);
    print("Parsed JSON object keys count: " + oidValuesJSON.size());

    // Get field names using iterator
    var keys = [];
    var fieldsIterator = oidValuesJSON.fieldNames();
    while(fieldsIterator.hasNext()) {
        keys.push(fieldsIterator.next());
    }
    print("Extracted keys count: " + keys.length);
	

	//var itr = keys.iterator();
	var oidName = null;
	var oidValue = null;
	var multiInstance = new java.util.HashMap();
	var singleInstance = new java.util.HashMap();
	var forceMultiInstanceOids = new java.util.HashSet(java.util.Arrays.asList("1.3.6.1.2.1.4.20.1.1", "1.3.6.1.2.1.4.20.1.2", "1.3.6.1.2.1.4.20.1.3", "1.3.6.1.2.1.4.20.1.4"));
	// Create a new iterator for processing OIDs
	var processingIterator = oidValuesJSON.fieldNames();
	while (processingIterator.hasNext()) {
		oidName = processingIterator.next();
		print("Processing OID: " + oidName);
		oidValue = oidValuesJSON.get(oidName).asText();
		print("OID Value: " + oidValue);	
		var parsedValueJSON = null;
        try {
            parsedValueJSON = mapper.readTree(oidValue);
        } catch (e) {
            // If not JSON, handle as simple value
            if (oidName == "recordId")
                singleInstance.put("recordId", oidValue);
            else if (oidName == "IP Address")
                singleInstance.put("ipaddress", oidValue);
            else if (oidValue != "" && oidValue != null && oidValue != "noSuchObject")
                singleInstance.put(secondLevelMapping(oidName), oidValue);
            continue;
        }
		
		if (parsedValueJSON.isObject()) {
			//Multiple instance should handle here
			var innerJSON = parsedValueJSON;
			var innerKeys = [];
			var innerFieldsIterator = innerJSON.fieldNames();
			while(innerFieldsIterator.hasNext()) {
				innerKeys.push(innerFieldsIterator.next());
			}
			print("Inner Keys: " + innerKeys);
			// Replace Java-style iterator with JavaScript array iteration
			if (innerKeys.length == 1 && !forceMultiInstanceOids.contains(oidName)) {
				var innerOidName = innerKeys[0];
				if(!parsedValueJSON.get(innerOidName).isObject()){
					finalJSON.put(firstLevelMapping(innerOidName), parsedValueJSON.get(innerOidName).asText());
				}
				continue;
			}
			
			for (var i = 0; i < innerKeys.length; i++) {
				var innerOidName = innerKeys[i];
				var innerOidValue = parsedValueJSON.get(innerOidName).asText();
				propertyName = secondLevelMapping(oidName);
				index = getPropertyIndex(oidName, innerOidName);
				print("Property Name: " + propertyName);
				print("Index: " + index);
				if (multiInstance.containsKey(firstLevelMapping(oidName))) {
					var entityExist = multiInstance.get(firstLevelMapping(oidName));
					if (entityExist.containsKey(index)) {
						var property = entityExist.get(index);
						property.put(secondLevelMapping(oidName), innerOidValue);
						entityExist.put(index, property);
						multiInstance.put(firstLevelMapping(oidName), entityExist);
					} else {
						var property = new java.util.HashMap(); //ipNetToMediaPhysAddress => 00:0c:29:82:b0:39
						property.put(secondLevelMapping(oidName), innerOidValue);
						entityExist.put(index, property);
						multiInstance.put(firstLevelMapping(oidName), entityExist);
					}
				}
				else {
					var property = new java.util.HashMap(); //ipNetToMediaPhysAddress => 00:0c:29:82:b0:39
					property.put(secondLevelMapping(oidName), innerOidValue);
					var entity = new java.util.HashMap();
					entity.put(index, property);
					multiInstance.put(firstLevelMapping(oidName), entity);
				}
			}
			print("MultiInstance: " + multiInstance);
		} else {
			// Simple mapping we need to add here
			if (oidName == "recordId")
				singleInstance.put("recordId", oidValue);
			else if (oidName == "IP Address")
				singleInstance.put("ipaddress", oidValue);
			else if (oidValue != "" && oidValue != null && oidValue != "noSuchObject")
				singleInstance.put(secondLevelMapping(oidName), oidValue);
		}
		print("SingleInstance: " + singleInstance);
		var EMPropertyName = getEMPropertyNameFromOID(oidName);
		if (EMPropertyName != null)
			finalRequestJSON.put(EMPropertyName, oidValuesJSON.get(oidName).asText());
		else
			finalRequestJSON.put(oidName, oidValuesJSON.get(oidName).asText()); // This might be some non oid field, e.g. recordId
	}
	//Second level parsing to JSON
	//var finalJSON = new java.util.HashMap();
	var ifEntryArray,
	ifEntry,
	keysInIfEntry,
	itrInIfEntry,
	keyIfEntry,
	valueIfEntry,
	in2Keys,
	in2Itr,
	ifEntryHashMap,
	in2Key,
	in2Value;
	if (multiInstance.containsKey("ifEntry")) {
		print("MultiInstance contains ifEntry");
		ifEntryArray = new java.util.ArrayList();
		ifEntry = multiInstance.get("ifEntry");
		keysInIfEntry = ifEntry.keySet();
		itrInIfEntry = keysInIfEntry.iterator();
		while (itrInIfEntry.hasNext()) {

			keyIfEntry = itrInIfEntry.next();
			valueIfEntry = ifEntry.get(keyIfEntry);

			in2Keys = valueIfEntry.keySet();
			in2Itr = in2Keys.iterator();
			ifEntryHashMap = new java.util.HashMap();
			while (in2Itr.hasNext()) {
				in2Key = in2Itr.next();
				in2Value = valueIfEntry.get(in2Key);
				var mappedKey = thirdLevelMapping(in2Key);
				print("Mapped Key: " + mappedKey);
				//ifEntryHashMap.put(thirdLevelMapping(in2Key), in2Value); //Third level mapping needed here
				if ("Network Adapter".equals(mappedKey)) {
                    ifEntryHashMap.put("Network Interface", in2Value);
                } else if ("Network Adapter Description".equals(mappedKey)) {
                    ifEntryHashMap.put("Description", in2Value);
                } else if ("Network Adapter Type".equals(mappedKey)) {
                    ifEntryHashMap.put("Type", in2Value);
                } else if ("Network Adapter Name".equals(mappedKey)) {
                   ifEntryHashMap.put("Network Interface Name", in2Value);
                } else {
                   ifEntryHashMap.put(mappedKey, in2Value);
                }
			}
			ifEntryArray.add(ifEntryHashMap);
		}
		//finalJSON.put("Network Adapter", ifEntryArray);
		print("ifEntryArray: " + ifEntryArray);
		finalJSON.put("Network Interface", ifEntryArray);
	}

	if (multiInstance.containsKey("ipAddrEntry")) {
		print("multiInstance contains ipAddrEntry");
		ifEntryArray = new java.util.ArrayList();
		ifEntry = multiInstance.get("ipAddrEntry");
		keysInIfEntry = ifEntry.keySet();
		itrInIfEntry = keysInIfEntry.iterator();
		while (itrInIfEntry.hasNext()) {

			keyIfEntry = itrInIfEntry.next();
			valueIfEntry = ifEntry.get(keyIfEntry);

			in2Keys = valueIfEntry.keySet();
			in2Itr = in2Keys.iterator();
			ifEntryHashMap = new java.util.HashMap();
			while (in2Itr.hasNext()) {
				in2Key = in2Itr.next();
				in2Value = valueIfEntry.get(in2Key);
				ifEntryHashMap.put(thirdLevelMapping(in2Key), in2Value); //Third level mapping needed here
			}
			ifEntryArray.add(ifEntryHashMap);
		}
		finalJSON.put("IPV4 Address", ifEntryArray);
		print("finalJSON: " + finalJSON);
	}
	// Process PDU properties from multiInstance (PDU OIDs are multi-instance JSON objects)
	var hasPDUOIDs = false;
	
	// Check for PDU OIDs in original input data
	var oidKeys = oidValuesJSON.fieldNames();
	while (oidKeys.hasNext()) {
		var oidKey = oidKeys.next();
		if (oidKey.indexOf("1.3.6.1.4.1.3711.24.1.1.7.3.1.1") == 0 || 
		    oidKey.indexOf("1.3.6.1.4.1.3711.24.1.1.7.4.1.1") == 0) {
			hasPDUOIDs = true;
			print("PDU OID detected: " + oidKey);
		}
	}
	
	// Process PDU Entry from multiInstance (similar to ifEntry processing)
	if (hasPDUOIDs && multiInstance.containsKey("pduEntry")) {
		print("PDU detected - processing PDU properties from multiInstance");
		var pduEntry = multiInstance.get("pduEntry");
		var pduKeys = pduEntry.keySet().iterator();
		
		// Collect all property values grouped by property name
		var propertyValuesMap = new java.util.HashMap();
		
		// First pass: collect all values for each property
		while (pduKeys.hasNext()) {
			var pduIndex = pduKeys.next();
			var pdu = pduEntry.get(pduIndex);
			var pduProps = pdu.keySet().iterator();
			
			print("Processing PDU instance: " + pduIndex);
			while (pduProps.hasNext()) {
				var propKey = pduProps.next();
				var propValue = pdu.get(propKey);
				var finalPropName = thirdLevelMapping(propKey);
				
				if (finalPropName && finalPropName != "" && !finalPropName.equals("PDU")) {
					if (!propertyValuesMap.containsKey(finalPropName)) {
						propertyValuesMap.put(finalPropName, new java.util.ArrayList());
					}
					var valueList = propertyValuesMap.get(finalPropName);
					valueList.add("unit " + pduIndex + " - " + propValue);
					print("Collected: " + finalPropName + " -> unit " + pduIndex + " - " + propValue);
				}
			}
		}
		
		// Second pass: combine values into comma-separated string and add to finalJSON
		var propertyKeys = propertyValuesMap.keySet().iterator();
		while (propertyKeys.hasNext()) {
			var propName = propertyKeys.next();
			var valueList = propertyValuesMap.get(propName);
			var commaSeparatedValue = "";
			for (var i = 0; i < valueList.size(); i++) {
				if (i > 0) {
					commaSeparatedValue += ", ";
				}
				commaSeparatedValue += valueList.get(i);
			}
			finalJSON.put(propName, commaSeparatedValue);
			print("Added to finalJSON: " + propName + " = " + commaSeparatedValue);
		}
	}
	
	// Process Outlet Entry from multiInstance
	if (hasPDUOIDs && multiInstance.containsKey("outletEntry")) {
		print("Outlet detected - processing Outlet properties from multiInstance");
		var outletEntry = multiInstance.get("outletEntry");
		var outletKeys = outletEntry.keySet().iterator();
		
		// Collect all property values grouped by property name
		var outletPropertyValuesMap = new java.util.HashMap();
		
		// First pass: collect all values for each property
		while (outletKeys.hasNext()) {
			var outletIndex = outletKeys.next();
			var outlet = outletEntry.get(outletIndex);
			var outletProps = outlet.keySet().iterator();
			
			print("Processing Outlet instance: " + outletIndex);
			while (outletProps.hasNext()) {
				var propKey = outletProps.next();
				var propValue = outlet.get(propKey);
				var finalPropName = thirdLevelMapping(propKey);
				
				if (finalPropName && finalPropName != "" && !finalPropName.equals("PDU Outlet")) {
					if (!outletPropertyValuesMap.containsKey(finalPropName)) {
						outletPropertyValuesMap.put(finalPropName, new java.util.ArrayList());
					}
					var valueList = outletPropertyValuesMap.get(finalPropName);
					valueList.add("unit " + outletIndex + " - " + propValue);
					print("Collected: " + finalPropName + " -> unit " + outletIndex + " - " + propValue);
				}
			}
		}
		
		// Second pass: combine values into comma-separated string and add to finalJSON
		var outletPropertyKeys = outletPropertyValuesMap.keySet().iterator();
		while (outletPropertyKeys.hasNext()) {
			var propName = outletPropertyKeys.next();
			var valueList = outletPropertyValuesMap.get(propName);
			var commaSeparatedValue = "";
			for (var i = 0; i < valueList.size(); i++) {
				if (i > 0) {
					commaSeparatedValue += ", ";
				}
				commaSeparatedValue += valueList.get(i);
			}
			finalJSON.put(propName, commaSeparatedValue);
			print("Added to finalJSON: " + propName + " = " + commaSeparatedValue);
		}
	}
	
	if (hasPDUOIDs) {
		print("PDU properties processed and added to finalJSON");
	}

	if (!singleInstance.isEmpty()) {
		in2Keys = singleInstance.keySet();
		in2Itr = in2Keys.iterator();
		print("in2Keys: " + in2Keys);
		print("in2Itr: " + in2Itr);	
		var systemObjectID = oidValuesJSON.get("1.3.6.1.2.1.1.2.0").asText();
		var enterpriseID = getEntepriseIDFromSystemObjectID(systemObjectID);
		print("EnterpriseID : " + enterpriseID);
		while (in2Itr.hasNext()) {
			in2Key = in2Itr.next();
			in2Value = singleInstance.get(in2Key);
			finalJSON.put(thirdLevelMapping(in2Key), in2Value); //Third level mapping needed here

			//to support Digi Connect Memory Parsing
			if (enterpriseID == "332") {
				if (in2Key == "1.3.6.1.4.1.332.11.6.1.8.0") {
					var ramSize = Number((in2Value / 1024) / 1024).toFixed(2);
					finalJSON.put(thirdLevelMapping(in2Key), ramSize);
				} else if (in2Key == "1.3.6.1.4.1.332.11.6.1.9.0") {
					var ramAvailable = (((in2Value / 1024) / 1024) / 1024).toFixed(2);
					finalJSON.put(thirdLevelMapping(in2Key), ramAvailable);
				} else if (in2Key == "1.3.6.1.4.1.332.11.6.1.10.0") {
					var ramUsage = (((in2Value / 1024) / 1024) / 1024).toFixed(2);
					finalJSON.put(thirdLevelMapping(in2Key), ramUsage);
				}
			} else {
				// Memory Parsing for future new devices.
			}
		}
	}
	print("multiInstance: " + multiInstance);
    if (multiInstance && multiInstance.containsKey("chassisMembersEntry")) {
        var chassisMembersEntry = multiInstance.get("chassisMembersEntry");
	    var chassisClusterIpAddress=finalJSON.get("IP Address");
        var members = [];
        var keys = chassisMembersEntry.keySet();
        for (var keyIndex = 0; keyIndex < keys.size(); keyIndex++) {
             var key = keys.toArray()[keyIndex];
                 if (key.startsWith("2.")) {
                     var serialNumberKey = key;
                     var macKey = String(key).replace(/^2\./, "4.");
                     var softwareVersionKey = String(key).replace(/^2\./, "5.");
                     var modelKey = String(key).replace(/^2\./, "8.");
                     var uptimeKey = String(key).replace(/^2\./, "7.");
                 if (chassisMembersEntry.containsKey(serialNumberKey) && chassisMembersEntry.containsKey(macKey) && chassisMembersEntry.containsKey(softwareVersionKey) && chassisMembersEntry.containsKey(modelKey) && chassisMembersEntry.containsKey(uptimeKey)) {
                      var serialNumber = chassisMembersEntry.get(serialNumberKey).get("chassMembInfo");
                      var macAddress = chassisMembersEntry.get(macKey).get("chassMembInfo");
                      var softwareVersion = chassisMembersEntry.get(softwareVersionKey).get("chassMembInfo");
                      var model = chassisMembersEntry.get(modelKey).get("chassMembInfo");
                   // var uptime = chassisMembersEntry.get(uptimeKey).get("chassMembInfo");
                members.push({
                    "Serial Number": serialNumber,
                    "MAC Address": macAddress,
                    "Software Version": softwareVersion,
                    "Model": model,
                    //"Device Uptime": uptime
					"blueprint":"Switch",
					"Device Manufacturer Name":"Juniper Networks, Inc.",
					"Chassis Cluster IpAddress":chassisClusterIpAddress
                });
            }
        }
    }
	print("members: " + members);
        if (members.length > 0) {
            var gson = new Gson();
            var jsonOutput = gson.toJson(members);
            finalJSON.put("Chassis Member Info", members);
        } else
            print("No chassis members found.");
     }
	print("finalJSON: " + finalJSON);
     var baseMacFromCiscoOID = null;
     if (singleInstance.containsKey("1.3.6.1.4.1.9.9.380.1.1.8.0")) {
         baseMacFromCiscoOID = singleInstance.get("1.3.6.1.4.1.9.9.380.1.1.8.0");
         if (baseMacFromCiscoOID && baseMacFromCiscoOID.trim().length() > 0 && baseMacFromCiscoOID.trim() !== "00:00:00:00:00:00") {
             baseMacFromCiscoOID = baseMacFromCiscoOID.trim().toLowerCase();
             print("Base MAC from Cisco OID: " + baseMacFromCiscoOID);
             finalJSON.put("MAC Address", baseMacFromCiscoOID);
         } else {
             baseMacFromCiscoOID = null;
         }
     }
	 if(singleInstance.containsKey("sysDescr")){
		var description=singleInstance.get("sysDescr");
		var osname=parseOSNameFromSysDescr(description);
		finalJSON.put("Operating System", osname);
	 }

print("singleInstance "+singleInstance.containsKey("1.3.6.1.4.1.9.9.380.1.1.8.0"));
print("baseMacFromCiscoOID "+baseMacFromCiscoOID);
if (!baseMacFromCiscoOID && multiInstance.containsKey("ifEntry")) {
    var ifEntry = multiInstance.get("ifEntry");
    var vlanMac = null;    // Priority 1 - VLAN MAC (ifType 53 or 136)
    var ipIntfMac = null;  // Priority 2 - Switch IP Interface (ifType 24)
    var priorityMac = null; // Priority 3 - Port-Channel/Link Aggregate (ifType 161)
    var fallbackMac = null; // Priority 4 - First operational MAC (ifType 6 or valid port)

    var macSet = new java.util.HashSet();  // Track unique valid entries
    var bestVlanMac = null;
    var bestVlanIndex = Number.MAX_SAFE_INTEGER;

    var keys = ifEntry.keySet().iterator();
    print("Find base mac:::::::::::");

    while (keys.hasNext()) {
        var idx = keys.next();
        var entry = ifEntry.get(idx);
        print("entry:::::" + entry);

        // Ensure required keys exist
        if (entry.containsKey("ifPhysAddress") && entry.containsKey("ifType")) {
            var mac = entry.get("ifPhysAddress").toLowerCase(); // Normalize MAC
            var ifType = String(entry.get("ifType")).trim(); // Convert to string and trim
            var ifName = entry.containsKey("ifName") ? entry.get("ifName").toLowerCase() : "";
            var ifIndex = parseInt(entry.containsKey("ifIndex") ? entry.get("ifIndex") : 9999999);
            var ifOperStatus = parseInt(entry.containsKey("ifOperStatus") ? entry.get("ifOperStatus") : 2);

            print("mac::::" + mac + ", ifType::::" + ifType + ", ifOperStatus::::" + ifOperStatus);

            // Skip empty or default MACs and prevent duplicates
            var uniqueKey = mac + ":" + ifType;
            if (mac && mac !== "00:00:00:00:00:00" && String(mac).trim().length > 0 && !macSet.contains(uniqueKey)) {
                macSet.add(uniqueKey); // Track unique entries

                // Priority 1: VLAN Interface (ifType 53 for Cisco or Aruba / 136 for others)
                if ((ifType === "53" || ifType === "136") && ifOperStatus === 1) {
                    // Prioritize Vlan1 (ifName == "vl1") or lowest ifIndex
                    if (ifName === "vl1" || ifIndex === 1) {
                        bestVlanMac = mac;
                        bestVlanIndex = ifIndex;
                        print("Management VLAN prioritized: " + bestVlanMac);
                    }
                    // If no Vlan1, pick lowest index
                    else if (vlanMac === null || ifIndex < bestVlanIndex) {
                        vlanMac = mac;
                        bestVlanIndex = ifIndex;
                        print("VLAN Interface selected: " + vlanMac);
                    }
                }

                // Priority 2: Switch IP Interface (ifType 24, operational)
                if (ifType === "24" && ifOperStatus === 1 && ipIntfMac === null) {
                    ipIntfMac = mac;
                    print("Switch IP Interface selected: " + ipIntfMac);
                }

                // Priority 3: Port-Channel/Link Aggregate (ifType 161, operational)
                if (ifType === "161" && ifOperStatus === 1 && priorityMac === null) {
                    priorityMac = mac;
                    print("Port-Channel/Aggr selected: " + priorityMac);
                }

                // Priority 4: Fallback - First operational MAC (ifType 6 or valid operational port)
                if (fallbackMac === null && ifOperStatus === 1 && (ifType === "6" || ifType === "24")) {
                    fallbackMac = mac;
                    print("Fallback MAC selected: " + fallbackMac);
                }
            }
        }
    }
// Debugging to verify which MACs are picked
    print("vlanMac: " + vlanMac);
    print("ipIntfMac: " + ipIntfMac);
    print("priorityMac: " + priorityMac);
    print("fallbackMac: " + fallbackMac);

    // Pick the highest priority VLAN, preferring Vlan1 if available
    var baseMac = bestVlanMac !== null ? bestVlanMac :
                  (vlanMac !== null ? vlanMac :
                  (ipIntfMac !== null ? ipIntfMac :
                  (priorityMac !== null ? priorityMac : fallbackMac)));

    if (baseMac) {
        print("Correct Base MAC Found: " + baseMac);
        finalJSON.put("MAC Address", baseMac);
    } else {
        print("No valid MAC address found.");
    }
}
	// Detect PDU by checking for PDU-specific OIDs
	var isPDU = false;
	var systemObjectID = oidValuesJSON.get("1.3.6.1.2.1.1.2.0") != null ? oidValuesJSON.get("1.3.6.1.2.1.1.2.0").asText() : null;
	
	// Check System Object ID for PDU vendor (3711)
	if (systemObjectID != null && systemObjectID.indexOf("1.3.6.1.4.1.3711.24") == 0) {
		isPDU = true;
		print("PDU detected from System Object ID: " + systemObjectID);
	}
	
	// Also check for PDU OIDs in original data
	if (!isPDU) {
		var oidKeys = oidValuesJSON.fieldNames();
		while (oidKeys.hasNext()) {
			var oidKey = oidKeys.next();
			if (oidKey.indexOf("1.3.6.1.4.1.3711.24.1.1.7.3.1.1") == 0 || 
			    oidKey.indexOf("1.3.6.1.4.1.3711.24.1.1.7.4.1.1") == 0) {
				isPDU = true;
				print("PDU detected from OID: " + oidKey);
				break;
			}
		}
	}
	
	if (isPDU) {
		finalJSON.put("blueprint", "Power Distribution Unit");
		print("Blueprint set to: Power Distribution Unit");
	} else {
		finalJSON.put("blueprint", "Network Device");
	}
	try {
    var hostName = finalJSON.get("Host Name");
    print("hostName::: " + hostName);

    var deviceName = finalJSON.get("Device Name");
    print("deviceName::: " + deviceName);

    if ((hostName == null || String(hostName).trim() == "") &&
        (deviceName != null && String(deviceName).trim() != "")) {

        print("Host Name missing in SNMP — using Device Name as Host Name fallback.");
        finalJSON.put("Host Name", String(deviceName).trim());
    }
} catch (e) {
    print("Hostname fallback error: " + e);
}
	// Location property is the property which we query from the printer
	// That doesn't point the location where the printer installed
	// So that property is going to set as empty string
	if (finalJSON.get("blueprint") && finalJSON.get("blueprint").equals("Printer")) {
        finalJSON.put("Device Location", "");
    }
	} catch (e) {
		e.rhinoException.printStackTrace();
	}

    var gson = new Gson();
    var outputStr = gson.toJson(finalJSON);
    print("Final output size: " + outputStr.length() + " characters");
    print("=== FINISHED snmpSensorForNonWindows ===");
	print("Final JSON Output: " + outputStr);
    
    return outputStr;
}

function snmpSensorForWindows(data) {
	try {
		// Create Jackson ObjectMapper
		var mapper = new ObjectMapper();
		var jsonObject = mapper.readTree(data);
		var jsonProp = OIDtoPropertyMapping();

		// Get field names using iterator
		var oids = [];
		var fieldsIterator = jsonObject.fieldNames();
		while (fieldsIterator.hasNext()) {
			oids.push(fieldsIterator.next());
		}

		var propArray = Object.keys(jsonProp);
		var result = mapper.createObjectNode();

		var storageUsed = new java.util.HashMap(),
			storageType = new java.util.HashMap(),
			storageKind = new java.util.HashMap(),
			storageIndex = new java.util.HashMap(),
			storageSize = new java.util.HashMap(),
			storageLabels = new java.util.HashMap(),
			storageAllocationUnit = new java.util.HashMap();
		var softwareIndex = new java.util.HashMap(),
			softwareName = new java.util.HashMap(),
			softwareType = new java.util.HashMap(),
			softwareInstall = new java.util.HashMap();
		var processName = new java.util.HashMap(),
		    processCommand = new java.util.HashMap(),
			processArguments = new java.util.HashMap();
		var networkSpeed = new java.util.HashMap(),
			networkIpAddress = new java.util.HashMap(),
			networkIndex = new java.util.HashMap(),
			networkName = new java.util.HashMap(),
			networkMask = new java.util.HashMap(),
			networkIfIndex = new java.util.HashMap(),
			networkPhysAddress = new java.util.HashMap(),
			deviceType = new java.util.HashMap(),
			deviceDescription = new java.util.HashMap();
		var tcpConnState = new java.util.HashMap(),
            tcpLocalAddress = new java.util.HashMap(),
            tcpLocalPort = new java.util.HashMap(),
            tcpRemoteAddress = new java.util.HashMap(),
            tcpRemotePort = new java.util.HashMap();

		var twoDec = new java.text.DecimalFormat("##.##");

		var keyArray = oids;
		var keySize = keyArray.length;
		var propSize = propArray.length;

		for (var key = 0; key < keySize; key++) {
			for (var propKey = 0; propKey < propSize; propKey++) {
				if (keyArray[key].equals(propArray[propKey])) {

					var keyAsDescription = jsonProp[propArray[propKey]];
					var obj = jsonObject.get(keyArray[key]);
					if (obj != null && obj.isTextual()) {

						try {
							var value = jsonObject.get(keyArray[key]).asText();
							var isJSON = checkValidJSON(value);
							if (isJSON) {
								var hashMap = new java.util.HashMap();
								var testObj = mapper.readTree(value);
								var subKeysIterator = testObj.fieldNames();
								while (subKeysIterator.hasNext()) {
									var oid = subKeysIterator.next();
									var value = testObj.get(oid).asText();
									if (keyAsDescription.equals("Network Adapter Name")) {
										value = hex2a(value);
									}
									var rootOID = keyArray[key];
									oid = oid.replaceAll(rootOID + ".", "");
									hashMap.put(oid, value);
								}
								print("keyAsDescription", keyAsDescription);
								if (keyAsDescription.equals("Storage Index")) {
									storageIndex = hashMap;
								}
								if (keyAsDescription.equals("FS Type")) {
									storageType = hashMap;
								}
								if (keyAsDescription.equals("Storage Labels")) {
									storageLabels = hashMap;
								}
								if (keyAsDescription.equals("Storage Size")) {
									storageSize = hashMap;
								}
								if (keyAsDescription.equals("Storage Used")) {
									storageUsed = hashMap;
								}
								if (keyAsDescription.equals("Storage Allocation Unit")) {
									storageAllocationUnit = hashMap;
								}
								if (keyAsDescription.equals("Software Index")) {
									softwareIndex = hashMap;
								}
								if (keyAsDescription.equals("Software Type")) {
									softwareType = hashMap;
								}
								if (keyAsDescription.equals("Software Name")) {
									softwareName = hashMap;
								}
								if (keyAsDescription.equals("Software Install Date")) {
									softwareInstall = hashMap;
								}
								if (keyAsDescription.equals("Process Name")) {
									processName = hashMap;
								}
								if (keyAsDescription.equals("Process Index")) {
									processIndex = hashMap;
								}
								if (keyAsDescription.equals("Process Command")) {
									processCommand = hashMap;
								}
                                if (keyAsDescription.equals("TCP Connection State")) {
                                    tcpConnState = hashMap;
                                }
                                if (keyAsDescription.equals("TCP Local Address")) {
                                    tcpLocalAddress = hashMap;
                                }
                                if (keyAsDescription.equals("TCP Local Port")) {
                                    tcpLocalPort = hashMap;
                                }
                                if (keyAsDescription.equals("TCP Remote Address")) {
                                    tcpRemoteAddress = hashMap;
                                }
                                if (keyAsDescription.equals("TCP Remote Port")) {
                                    tcpRemotePort = hashMap;
                                }
								if (keyAsDescription.equals("Process Arguments")) {
									processArguments = hashMap;
								}
								if (keyAsDescription.equals("Storage Type")) {
									storageKind = hashMap;
								}
								if (keyAsDescription.equals("Network Speed")) {
									networkSpeed = hashMap;
								}
								if (keyAsDescription.equals("Network ifIndex")) {
									networkIndex = hashMap;
								}
								if (keyAsDescription.equals("Network Adapter Name")) {
									networkName = hashMap;
								}
								if (keyAsDescription.equals("IP Address")) {
									networkIpAddress = hashMap;
								}
								if (keyAsDescription.equals("Netmask")) {
									networkMask = hashMap;
								}
								if (keyAsDescription.equals("Interface Physical Address")) {
									networkPhysAddress = hashMap;
								}
								if (keyAsDescription.equals("IP Interface Index")) {
									networkIfIndex = hashMap;
								}
								if (keyAsDescription.equals("Device Type")) {
									deviceType = hashMap;
								}
								if (keyAsDescription.equals("Device Description")) {
									deviceDescription = hashMap;
								}

							} else {

								if (keyAsDescription.equals("RAM(MB)")) {
									var ramLong = java.lang.Double.parseDouble(value);
									var ram = java.lang.Double.valueOf(twoDec.format(ramLong / 1024));
									value = ram;
									result.put(keyAsDescription, value.toString());
								} else if (keyAsDescription.equals("System Description")) {
									var a1 = value.split("Build");
									var a2 = a1[1].split(" ");
									result.put("OS Build Number", a2[1].trim());

									var b1 = value.split("Version");
									var b2 = b1[1].split(" ");
									result.put("OS Version", b2[1].trim() + "." + a2[1].trim());
								} else if (keyAsDescription.equals("OS Local Date Time")) {
									result.put(keyAsDescription, dateParser(value));
								} else if (keyAsDescription.equals("Uptime")) {
									var s = value.split(",");
									value = s[0].trim();
									result.put(keyAsDescription, value);
								} else {
									result.put(keyAsDescription, value);
								}

							}
						} catch (e) {
							e.rhinoException.printStackTrace();
						}
					}
				}
			}
		}

		var jsonArray = mapper.createArrayNode();
		var keys = storageUsed.keySet();
		var itr = keys.iterator();
		while (itr.hasNext()) {
			var key = itr.next();
			var json = mapper.createObjectNode();

			var diskSize = 0.0,
				diskFree = 0.0,
				diskUsed = 0.0,
				diskUsedPercentage = 0.0,
				diskFreePercentage = 0.0;
			var diskName = null,
				mountPoint = null,
				serialNumber = null,
				diskType = null,
				diskKind = null;
			try { //generate desired outputs
				var storageUsedInt = java.lang.Long.parseLong(storageUsed.get(key));
				var allocationUnitInt = java.lang.Long.parseLong(storageAllocationUnit.get(key));
				var storageSizeInt = java.lang.Long.parseLong(storageSize.get(key));

				var storgKind = new java.util.HashMap();

				storgKind.put("1.3.6.1.2.1.25.2.1.4", "Fixed Disk");
				storgKind.put("1.3.6.1.2.1.25.2.1.7", "Compact Disk");
				storgKind.put("1.3.6.1.2.1.25.2.1.3", "Virtual Memory");
				storgKind.put("1.3.6.1.2.1.25.2.1.2", "RAM");
				storgKind.put("1.3.6.1.2.1.25.2.1.5", "Removable Disk");
				storgKind.put("1.3.6.1.2.1.25.2.1.1", "Other");

				var oid = storageKind.get(key);
				var keys = storgKind.keySet();
				var it1 = keys.iterator();
				while (it1.hasNext()) {
					var key1 = it1.next();
					if (oid == key1) {
						diskKind = storgKind.get(oid);
					}
				}

				var storgType = new java.util.HashMap();

				storgType.put("1.3.6.1.2.1.25.3.9.9", "NTFS");
				storgType.put("1.3.6.1.2.1.25.3.9.5", "FAT");
				storgType.put("1.3.6.1.2.1.25.3.9.23", "EXT2");
				storgType.put("1.3.6.1.2.1.25.3.9.1", "Other");

				var oidType = storageType.get(key);
				var keysType = storgType.keySet();
				var it2 = keysType.iterator();
				while (it2.hasNext()) {
					var key2 = it2.next();
					if (oidType == key2) {
						diskType = storgType.get(oidType);
					}
				}

				var name = storageLabels.get(key);
				if (name.contains("Serial Number")) {
					var arr = name.split("Serial Number");
					var arr1 = name.split(":");
					diskName = mountPoint = arr1[0];
					serialNumber = arr[1];
				} else {
					serialNumber = "";
					name = name.replaceAll("[:\\\\]", "");
					diskName = name;
					mountPoint = "";
				}

				diskSize = (storageSizeInt * allocationUnitInt) / 1024.0 / 1024.0 / 1024.0;
				diskUsed = (storageUsedInt * allocationUnitInt) / 1024.0 / 1024.0 / 1024.0;
				if (twoDec.format(diskSize) != 0.0) {
					diskFree = diskSize - diskUsed;
					diskUsedPercentage = twoDec.format((diskUsed / diskSize) * 100);
					diskFreePercentage = twoDec.format((diskFree / diskSize) * 100);
					diskFree = twoDec.format(diskFree);
				} else {
					diskFreePercentage = 0.0;
					diskUsedPercentage = 0.0;
					diskFree = 0.0;
				}
				diskSize = twoDec.format(diskSize);
				diskUsed = twoDec.format(diskUsed);

			} catch (e) {
				e.rhinoException.printStackTrace();
			}

			if (!(diskName.equals("Virtual Memory")) && !(diskName.equals("Physical Memory"))) {
				json.put("Disk Used Percentage", diskUsedPercentage + "%");
				json.put("Disk Size(GB)", diskSize + " GB");
				if (diskKind == null)
					diskKind = "";
				json.put("Disk Kind", diskKind);
				if (diskType == null)
					diskType = "";
				json.put("Disk Type", diskType);
				json.put("Disk Free Percentage", diskFreePercentage + "%");
				json.put("Free Disk Space(GB)", diskFree + " GB");
				json.put("Mount Point", mountPoint);
				json.put("Disk Used Space(GB)", diskUsed + " GB");
				json.put("id", storageIndex.get(key) != null ? storageIndex.get(key) : "");
				json.put("Disk Name", diskName + ":");
				json.put("Disk Volume Serial Number", serialNumber.trim());
				jsonArray.add(json);
			}
		}
		result.set("Storage Disk", jsonArray);
		//-------------------------------
		var xIp = new java.util.HashMap();
		var yMask = new java.util.HashMap();
		var key7 = networkIfIndex.keySet();
		var it7 = key7.iterator();
		while (it7.hasNext()) {
			var key = it7.next();
			var key2 = networkIpAddress.keySet();
			var it2 = key2.iterator();
			while (it2.hasNext()) {
				var duk = it2.next();
				if (key == duk) {
					xIp.put(networkIfIndex.get(key), networkIpAddress.get(duk));
					yMask.put(networkIfIndex.get(key), networkMask.get(duk));
				}
			}
		}
		var jsonArray2 = mapper.createArrayNode();
		var keys = xIp.keySet();
		var itr = keys.iterator();
		while (itr.hasNext()) {
			var key = itr.next();
			var json = mapper.createObjectNode();
			//converting naSpeed from bps to Mbps
			if (isNaN(networkSpeed.get(key)))
				json.put("Network Speed", networkSpeed.get(key));
			else
				json.put("Network Speed", networkSpeed.get(key) / 1000000);
			json.put("IP Address", xIp.get(key));
			json.put("Network ifIndex", networkIndex.get(key) != null ? networkIndex.get(key) : "");
			json.put("Network Adapter Duplex", "");
			json.put("Network Adapter Name", networkName.get(key) != null ? networkName.get(key) : "");
			json.put("Netmask", yMask.get(key));
			json.put("Default Gateway", "");
			json.put("MAC Address", networkPhysAddress.get(key) != null ? networkPhysAddress.get(key) : "");
			json.put("Broadcast Address", "");
			jsonArray2.add(json);
		}
		result.set("Network Adapter", jsonArray2);
		//-------------------------------
		var jsonArray1 = mapper.createArrayNode();

		var keys = softwareIndex.keySet();
		var itr = keys.iterator();
		while (itr.hasNext()) {
			var key = itr.next();
			var softwareNameValue = softwareName.get(key);
            var extractedVendor = extractVendorFromSoftwareName(softwareNameValue);

			json = mapper.createObjectNode();
			json.put("Software Version", "");
			json.put("Software Name", softwareNameValue);
			json.put("Software Install Location", "");
			json.put("Software Publisher", extractedVendor);
			json.put("Type", getSoftwareType(softwareType.get(key)));
			json.put("Software Install Date", dateParser(softwareInstall.get(key)));
			jsonArray1.add(json)
		}

		result.set("Installed Software", jsonArray1);
		//----------------------------------------
		result.put("blueprint", "Windows Host");
		if (result.has("Device Name"))
			result.put("Host Name", result.get("Device Name").asText());
		//---------------------------------------
		var jsonProcessArray = mapper.createArrayNode();
		var keys = processName.keySet();
		var itr = keys.iterator();
		var l = 0;
		while (itr.hasNext()) {
			var key = itr.next();
			var json = mapper.createObjectNode();
			json.put("Description", "");
			json.put("Command", processCommand.get(key) != null ? processCommand.get(key) : "");
			json.put("PID", processIndex.get(key));
			l = l + 1;
			json.put("id", l + "");
			json.put("Process Name", processName.get(key));
			json.put("PPID", "");
			if (processName.get(key) != "win_paexec.exe")
				json.put("Process Arguments", processArguments.get(key) != null ? processArguments.get(key) : "");
			else
				json.put("Process Arguments", "");
			jsonProcessArray.add(json);
		}

		result.set("Process", jsonProcessArray);
		//-----------------------------------------

			// --- IP Connections - Windows - Start ---
	var jsonIpsArray = mapper.createArrayNode();

    	// Get all unique connection indices from any of the TCP connection maps
		var allKeys = new java.util.HashSet();
		if (tcpConnState.keySet().size() > 0) {
			allKeys.addAll(tcpConnState.keySet());
		}
		if (tcpLocalAddress.keySet().size() > 0) {
			allKeys.addAll(tcpLocalAddress.keySet());
		}
		if (tcpLocalPort.keySet().size() > 0) {
			allKeys.addAll(tcpLocalPort.keySet());
		}
		if (tcpRemoteAddress.keySet().size() > 0) {
			allKeys.addAll(tcpRemoteAddress.keySet());
		}
		if (tcpRemotePort.keySet().size() > 0) {
			allKeys.addAll(tcpRemotePort.keySet());
		}

		var keys = allKeys.iterator();
		while (keys.hasNext()) {
			var connectionIndex = keys.next();

			// Extract data from individual OID maps using the connection index
			var localIPAddress = tcpLocalAddress.get(connectionIndex) || "0.0.0.0";
			var localPort = tcpLocalPort.get(connectionIndex) || "0";
			var remoteIPAddress = tcpRemoteAddress.get(connectionIndex) || "0.0.0.0";
			var remotePort = tcpRemotePort.get(connectionIndex) || "0";
			var connectionState = tcpConnState.get(connectionIndex) || "1";

			// Map connection state numbers to readable values
			var stateMap = {
				"1": "CLOSED",
				"2": "LISTEN",
				"3": "SYN_SENT",
				"4": "SYN_RECEIVED",
				"5": "ESTABLISHED",
				"6": "FIN_WAIT_1",
				"7": "FIN_WAIT_2",
				"8": "CLOSE_WAIT",
				"9": "LAST_ACK",
				"10": "CLOSING",
				"11": "TIME_WAIT"
			};

			var stateDescription = stateMap[connectionState] || "UNKNOWN";

			// Create JSON object with the extracted values
			var ipJson = mapper.createObjectNode();
			ipJson.put("Local IP Address", localIPAddress);
			ipJson.put("Local Port", localPort);
			ipJson.put("Remote IP Address", remoteIPAddress);
			ipJson.put("Remote Port", remotePort);
			ipJson.put("Protocol", "TCP");
			ipJson.put("State", stateDescription);
			jsonIpsArray.add(ipJson);
		}

	result.set("IP Connections", jsonIpsArray);

	// --- IP Connections - Windows - End ---
		// Add these variables with the other HashMap declarations (around line 843)


		// Add these conditions to the if-else block that processes JSON objects (around line 915)


		// Add this code block before the final return statement (after line 1181)
		//---------------------------------------
		// Create Peripheral Devices section
		/*var jsonDeviceArray = mapper.createArrayNode();
		var deviceTypeKeys = deviceType.keySet();
		var deviceItr = deviceTypeKeys.iterator();
		while (deviceItr.hasNext()) {
			var deviceKey = deviceItr.next();
			var deviceJson = mapper.createObjectNode();
			var typeValue = deviceType.get(deviceKey);
			var deviceDesc = deviceDescription.get(deviceKey) || "";

			// Map device type codes to human-readable values
			var deviceCategory = "Unknown";
			if (typeValue == "1.3.6.1.2.1.25.3.1.3") deviceCategory = "Processor";
			else if (typeValue == "1.3.6.1.2.1.25.3.1.4") deviceCategory = "Network Interface";
			else if (typeValue == "1.3.6.1.2.1.25.3.1.5") deviceCategory = "Printer";
			else if (typeValue == "1.3.6.1.2.1.25.3.1.6") deviceCategory = "Disk Storage";
			else if (typeValue == "1.3.6.1.2.1.25.3.1.13") deviceCategory = "Input Device";

			deviceJson.put("Device Type", deviceCategory);
			deviceJson.put("Device Name", deviceDesc);
			deviceJson.put("Device ID", deviceKey.split("\\.").pop());
			jsonDeviceArray.add(deviceJson);
		}
		result.set("Peripheral Devices", jsonDeviceArray);

		// Create separate arrays for USB devices and monitors
		var usbDevicesArray = mapper.createArrayNode();
		var monitorsArray = mapper.createArrayNode();
		var mainDeviceArray = mapper.createArrayNode();

		var deviceTypeKeys = deviceType.keySet();
		var deviceItr = deviceTypeKeys.iterator();
		while (deviceItr.hasNext()) {
			var deviceKey = deviceItr.next();
			var deviceJson = mapper.createObjectNode();
			var typeValue = deviceType.get(deviceKey);
			var deviceDesc = deviceDescription.get(deviceKey) || "";
			var deviceId = deviceKey.split("\\.").pop();
			
			// Determine if it's a USB device
			var isUSB = deviceDesc.toLowerCase().match(/usb|hid|human interface|universal serial bus/) !== null;
			
			// Determine if it's a monitor/display
			var isMonitor = (typeValue == "1.3.6.1.2.1.25.3.1.16" || // Display
							 typeValue == "1.3.6.1.2.1.25.3.1.19");  // Video
			
			// Only process USB and monitor devices
			if (isUSB || isMonitor) {
				deviceJson.put("Device ID", deviceId);
				deviceJson.put("Device Description", deviceDesc);
				
				if (isUSB) {
					deviceJson.put("Device Type", "USB");
					usbDevicesArray.add(deviceJson);
					mainDeviceArray.add(deviceJson);
				} 
				else if (isMonitor) {
					deviceJson.put("Device Type", "Monitor");
					monitorsArray.add(deviceJson);
					mainDeviceArray.add(deviceJson);
				}
			}
		}

		// Add separate collections to match the PowerShell sensor format
		if (usbDevicesArray.size() > 0) {
			result.set("USB Devices", usbDevicesArray);
		}
		if (monitorsArray.size() > 0) {
			result.set("Monitors", monitorsArray);
		}

		// Add the main collection of all peripheral devices
		result.set("Peripheral Device", mainDeviceArray); */
		
	} catch (e) {
		e.rhinoException.printStackTrace();
	}
	return result.toString();
}
// Function to map device types
function mapDeviceTypes(typeOid) {
	var map = {
		"1.3.6.1.2.1.25.3.1.1": "Other",
		"1.3.6.1.2.1.25.3.1.2": "Unknown",
		"1.3.6.1.2.1.25.3.1.3": "Processor",
		"1.3.6.1.2.1.25.3.1.4": "Network Interface",
		"1.3.6.1.2.1.25.3.1.5": "Printer",
		"1.3.6.1.2.1.25.3.1.6": "Disk Storage",
		"1.3.6.1.2.1.25.3.1.7": "Tape Storage",
		"1.3.6.1.2.1.25.3.1.8": "Other Storage",
		"1.3.6.1.2.1.25.3.1.9": "Serial Port",
		"1.3.6.1.2.1.25.3.1.10": "Parallel Port",
		"1.3.6.1.2.1.25.3.1.11": "Modem",
		"1.3.6.1.2.1.25.3.1.12": "Clock",
		"1.3.6.1.2.1.25.3.1.13": "Keyboard",
		"1.3.6.1.2.1.25.3.1.14": "Pointing Device",
		"1.3.6.1.2.1.25.3.1.15": "Network Interface",
		"1.3.6.1.2.1.25.3.1.16": "Display",
		"1.3.6.1.2.1.25.3.1.17": "Audio",
		"1.3.6.1.2.1.25.3.1.18": "Coprocessor",
		"1.3.6.1.2.1.25.3.1.19": "Video",
		"1.3.6.1.2.1.25.3.1.20": "Multimedia",
		"1.3.6.1.2.1.25.3.1.21": "Mass Storage",
		"1.3.6.1.2.1.25.3.1.22": "System Bus"
	};
	return map[typeOid] || "Unknown";
}

function snmpSensorForF5(data){

	// Create Jackson ObjectMapper
	var mapper = new ObjectMapper();
	var jsonObject = mapper.readTree(data);
	var jsonProp = OIDtoPropertyMapping();

	// Get field names using iterator
	var oids = [];
	var fieldsIterator = jsonObject.fieldNames();
	while(fieldsIterator.hasNext()) {
		oids.push(fieldsIterator.next());
	}

	var propArray = Object.keys(jsonProp);
	var result = mapper.createObjectNode();


	var keyArray = oids;
	var keySize = keyArray.length;
	var propSize = propArray.length;

	var poolName = new java.util.HashMap(),
	loadBalanceMethod = new java.util.HashMap(),
	//poolMonitorState = new java.util.HashMap(),
	//poolStatusDescription = new java.util.HashMap(),
	poolDescription = new java.util.HashMap(),
	activeMemberCount = new java.util.HashMap(),
	totalMemberCount = new java.util.HashMap(),
	poolIpAddress = new java.util.HashMap(),
	poolNameFromMember = new java.util.HashMap(),
	nodeNameFromPoolMember = new java.util.HashMap(),
	poolMonitor = new java.util.HashMap();

	var nodeName = new java.util.HashMap(),
	//nodeMonitor = new java.util.HashMap(),
	nodeRatio = new java.util.HashMap(),
	nodeMonitorState = new java.util.HashMap(),
	nodePort = new java.util.HashMap(),
	nodeIpAdress = new java.util.HashMap();

	var virtualServerName = new java.util.HashMap(),
	//virtualServerCount = new java.util.HashMap(),
	virtualIpAddress = new java.util.HashMap(),
	virtualPort = new java.util.HashMap(),
	destinationAddress = new java.util.HashMap(),
	defaultPool = new java.util.HashMap();
	//type = new java.util.HashMap(),
	//virtualServerId = new java.util.HashMap();

	var poolNameToMap = new java.util.HashMap(),
	nodeNameFromPool = new java.util.HashMap();

	for (var key = 0; key < keySize; key++) {
		for (var propKey = 0; propKey < propSize; propKey++) {
			if (keyArray[key].equals(propArray[propKey])) {
				var keyAsDescription = jsonProp[propArray[propKey]];
				//print("keyAsDescription : "+keyAsDescription);
				var value = jsonObject.get(keyArray[key]).asText();
				//print("key "+keyAsDescription);
				//print("value "+value);
				var isJSON = checkValidJSON(value);
				if(isJSON){
					var hashMap = new java.util.HashMap();
					var testObj = mapper.readTree(value);
					var subKeysIterator = testObj.fieldNames();
					while (subKeysIterator.hasNext()) {
						var oid = subKeysIterator.next();
						value = testObj.get(oid).asText();
						var rootOID = keyArray[key];
						oid = "." + oid;
						oid = oid.replace(rootOID , "");
						//print(oid);
						//print(value);
						hashMap.put(oid, value);
					}
					if (keyAsDescription.equals("Default Pool")) {
						defaultPool = hashMap;
					}
					if (keyAsDescription.equals("Destination Address/Mask")) {
						destinationAddress = hashMap;
					}
					if (keyAsDescription.equals("Virtual Port")) {
						virtualPort = hashMap;
					}
					if (keyAsDescription.equals("Virtual IP Address")) {
						virtualIpAddress = hashMap;
					}
					if (keyAsDescription.equals("Virtual Server Name")) {
						virtualServerName = hashMap;
					}

					if (keyAsDescription.equals("Node Name")) {
						nodeName = hashMap;
					}

					if (keyAsDescription.equals("Node Name From Pool Member")) {
						nodeNameFromPoolMember = hashMap;
					}

					if (keyAsDescription.equals("Node Ratio")) {
						nodeRatio = hashMap;
					}
					if (keyAsDescription.equals("Node Port")) {
						nodePort = hashMap;
					}
					if (keyAsDescription.equals("Node Monitor State")) {
						nodeMonitorState = hashMap;
					}
					if (keyAsDescription.equals("Node IP Address")) {
						nodeIpAdress = hashMap;
					}

					if (keyAsDescription.equals("Pool IP Address")) {
						poolIpAddress = hashMap;
					}

					if (keyAsDescription.equals("Pool Name From Member")) {
						poolNameFromMember = hashMap;
					}

					if (keyAsDescription.equals("Pool Name")) {
						poolName = hashMap;
					}
					if (keyAsDescription.equals("Load Balance Method")) {
						loadBalanceMethod = hashMap;
					}
					if (keyAsDescription.equals("Pool Description")) {
						poolDescription = hashMap;
					}
					if (keyAsDescription.equals("Active Member Count")) {
						activeMemberCount = hashMap;
					}
					if (keyAsDescription.equals("Total Member Count")) {
						totalMemberCount = hashMap;
					}
					if (keyAsDescription.equals("Pool Monitor")) {
						poolMonitor = hashMap;
					}
					if (keyAsDescription.equals("Pool Name to map")) {
						poolNameToMap = hashMap;
					}
					if (keyAsDescription.equals("Node Name from Pool")) {
						nodeNameFromPool = hashMap;
					}

				}else{
					var obj = jsonObject.get(keyArray[key]);
					if(keyAsDescription.equals("Device Name")){
						result.put("Host Name", value);
					}else
						result.put(keyAsDescription, value);
				}
			}
		}
	}

	//print(totalMemberCount)
	//Getting Pool Objects
	var vServerJsonArray = mapper.createArrayNode();
	var vServerKeys = virtualServerName.keySet();
	var vServerItr = vServerKeys.iterator();
	while(vServerItr.hasNext()){
		var vServerKey = vServerItr.next();
		var vServerJson = mapper.createObjectNode();
		var fullName = virtualServerName.get(vServerKey);
		if(virtualServerName.get(vServerKey).indexOf('/') != -1){
			var virtualServerAfterSplit = virtualServerName.get(vServerKey).split("[/]");
			var length = virtualServerAfterSplit.length;
			fullName = virtualServerAfterSplit[length-1];
		}
		vServerJson.put("Asset Name", fullName+"@"+convertHexToIP(virtualIpAddress.get(vServerKey)));
		vServerJson.put("IP Address", convertHexToIP(virtualIpAddress.get(vServerKey)));
		vServerJson.put("Server Port", virtualPort.get(vServerKey));
		//vServerJson.put("Destination Address",convertHexToIP(destinationAddress.get(vServerKey)));
		var defaultPoolName = defaultPool.get(vServerKey);
		if(defaultPool.get(vServerKey).indexOf('/') != -1){
			var defaulttPoolName = defaultPool.get(vServerKey).split("[/]");
			var length = defaulttPoolName.length;
			defaultPoolName = defaulttPoolName[length-1];
		}
		vServerJson.put("Default Pool", defaultPoolName);

		var poolJsonArray = mapper.createArrayNode();
		var poolKeys = poolName.keySet();
		var poolItr = poolKeys.iterator();
		while(poolItr.hasNext()){
			var poolKey = poolItr.next();
			var poolJson = mapper.createObjectNode();
			if(poolName.get(poolKey) == defaultPool.get(vServerKey)){
			    var poolNameToSplit = poolName.get(poolKey);
				if(poolName.get(poolKey).indexOf('/') != -1){
					var poolNameAfterSplit = poolName.get(poolKey).split("[/]");
					var length = poolNameAfterSplit.length;
					poolNameToSplit = poolNameAfterSplit[length-1];
				}
				poolJson.put("Asset Name", poolNameToSplit);
				var loadBalanceMethodValue = mapLoadBalanceKeysToValues(loadBalanceMethod.get(poolKey));
				poolJson.put("Load Balancing Method", loadBalanceMethodValue);
				poolJson.put("Description", poolDescription.get(poolKey));
				poolJson.put("Pool Monitor", poolMonitor.get(poolKey));

				//get IP Address of Pool by matching Pool name
				var nodeArray = mapper.createArrayNode();
				//var poolToNode = new org.json.simple.JSONObject();
				var poolNameFromMemberKeys = poolNameFromMember.keySet();
				var poolNameFromMemberItr = poolNameFromMemberKeys.iterator();
				while(poolNameFromMemberItr.hasNext()){
					poolNameFromMemberKey = poolNameFromMemberItr.next();
					if(poolName.get(poolKey) == poolNameFromMember.get(poolNameFromMemberKey)){


						var nodeJson = mapper.createObjectNode();

						var nodeKeys = nodeName.keySet();
						var nodeItr = nodeKeys.iterator();
						while(nodeItr.hasNext()){
							var nodeKey = nodeItr.next();
							if(nodeName.get(nodeKey) == nodeNameFromPoolMember.get(poolNameFromMemberKey)){
							var nodeNameToSplit = nodeName.get(nodeKey);
							if(nodeName.get(nodeKey).indexOf('/') != -1){
								var nodeNameAfterSplit = nodeName.get(nodeKey).split("[/]");
								var length = nodeNameAfterSplit.length;
								nodeNameToSplit = nodeNameAfterSplit[length-1];
							}
								nodeJson.put("Asset Name", nodeNameToSplit + "@"+convertHexToIP(nodeIpAdress.get(nodeKey)));
								nodeJson.put("IP Address", convertHexToIP(nodeIpAdress.get(nodeKey)));
								nodeJson.put("Server Port", nodePort.get(poolNameFromMemberKey));
								var monitorState = mapMonitorStateValues(nodeMonitorState.get(poolNameFromMemberKey));
								if(monitorState != "")
									nodeJson.put("Monitor State", monitorState);
							}
						}

						nodeArray.add(nodeJson);

					 }
					 poolJson.set("F5 Node", nodeArray);
				 }

				poolJsonArray.add(poolJson);
			}
		}
		vServerJson.set("Pool", poolJsonArray);

		vServerJsonArray.add(vServerJson);
	}
	result.set("Virtual Server", vServerJsonArray);

	result.put("blueprint", "F5 Big IP");

	return result.toString();
}

function snmpSensorForNetscalar(data)
{
    // Create Jackson ObjectMapper
    var mapper = new ObjectMapper();
    var jsonObject = mapper.readTree(data);
	var jsonProp = OIDtoPropertyMapping();

	// Get field names using iterator
	var oids = [];
	var fieldsIterator = jsonObject.fieldNames();
	while(fieldsIterator.hasNext()) {
		oids.push(fieldsIterator.next());
	}

	var propArray = Object.keys(jsonProp);
	var result = mapper.createObjectNode();

	var serviceName = new java.util.HashMap(),
	serviceIPAddress = new java.util.HashMap(),
	servicePort = new java.util.HashMap(),
	serviceType = new java.util.HashMap(),
	serviceState = new java.util.HashMap();

	var serverName = new java.util.HashMap(),
	serverIPAddress = new java.util.HashMap(),
	serverState = new java.util.HashMap(),
	serverFullName = new java.util.HashMap();

	var vServerName = new java.util.HashMap(),
	vServerIPAddress = new java.util.HashMap(),
	vServerPort = new java.util.HashMap(),
	vServerType = new java.util.HashMap(),
	lbMethod = new java.util.HashMap(),
	vServerState = new java.util.HashMap();

	var svcGrpMember = new java.util.HashMap(),
	svcGrpIpAddress = new java.util.HashMap(),
	svcGrpPort = new java.util.HashMap(),
	svcGrpType = new java.util.HashMap(),
	svcGrpServerName = new java.util.HashMap(),
	svcGrpState = new java.util.HashMap();

	var serviceNameMap = new java.util.HashMap(),
	vServerNameMap = new java.util.HashMap();

	var serviceGroupName = new java.util.HashMap(),
	serviceGroupState = new java.util.HashMap(),
	serviceGroupType = new java.util.HashMap();

	var keyArray = oids;
	var keySize = keyArray.length;
	var propSize = propArray.length;


	for (var key = 0; key < keySize; key++)
	{
		for (var propKey = 0; propKey < propSize; propKey++)
		{
			if (keyArray[key].equals(propArray[propKey]))
			{
				var keyAsDescription = jsonProp[propArray[propKey]];
				//print('Key From O/P : '+ keyArray[key])
				//print('Property Key : '+ propArray[propKey]);
				//print('keyAsDescription : '+ keyAsDescription);
				var obj = jsonObject.get(keyArray[key]);
				if (obj != null && obj.isTextual())
				{
					try
					{
						var value = jsonObject.get(keyArray[key]).asText();
						var isJSON = checkValidJSON(value);
						if (isJSON)
						{
							var hashMap = new java.util.HashMap();
							var testObj = mapper.readTree(value);
							var subKeysIterator = testObj.fieldNames();
							while (subKeysIterator.hasNext()) {
								var oid = subKeysIterator.next();
								//print(keyAsDescription +" oid :"+ oid);
								var val = testObj.get(oid).asText();
								//print(keyAsDescription +" val :"+ val);
								var rootOID = keyArray[key];
								oid = oid.replaceAll(rootOID + ".", "");
								//print(keyAsDescription +" after oid altration :"+ oid);
								hashMap.put(oid, val);
							}
							if (keyAsDescription.equals("Service Name")) {
								serviceName = hashMap;
								//print(" Service Name : "+serviceName);
							}else if(keyAsDescription.equals("Service IP Address")){
								serviceIPAddress = hashMap;
							}else if(keyAsDescription.equals("Service Port")){
								servicePort = hashMap;
							}else if(keyAsDescription.equals("Service Type")){
								serviceType = hashMap;
							}else if(keyAsDescription.equals("Service State")){
								serviceState = hashMap;
							}else if(keyAsDescription.equals("Server Name")){
								serverName = hashMap;
								//print(" Server Name : "+serverName);
							}else if(keyAsDescription.equals("Server IP Address")){
								serverIPAddress = hashMap;
							}else if(keyAsDescription.equals("Server State")){
								serverState = hashMap;
							}else if(keyAsDescription.equals("Server Full Name")){
								serverFullName = hashMap;
							}else if(keyAsDescription.equals("vServer Name")){
								vServerName = hashMap;
							}else if(keyAsDescription.equals("vServer IP Address")){
								vServerIPAddress = hashMap;
							}else if(keyAsDescription.equals("vServer Port")){
								vServerPort = hashMap;
							}else if(keyAsDescription.equals("vServer Type")){
								vServerType = hashMap;
							}else if(keyAsDescription.equals("vServer State")){
								vServerState = hashMap;
							}else if(keyAsDescription.equals("loadBalancingMethod")){
								lbMethod = hashMap;
							}else if(keyAsDescription.equals("serviceNameMap")){
								serviceNameMap = hashMap;
								//print(" serviceNameMap : "+serviceNameMap);
							}else if(keyAsDescription.equals("vServerNameMap")){
								vServerNameMap = hashMap;
								//print(" vServerNameMap : "+vServerNameMap);
							}else if(keyAsDescription.equals("svcGrpMemberName")){
								svcGrpMember = hashMap;
							}else if(keyAsDescription.equals("svcGrpMemberPrimaryIP")){
								svcGrpIpAddress = hashMap;
							}else if(keyAsDescription.equals("svcGrpMemberPrimaryPort")){
								svcGrpPort = hashMap;
							}else if(keyAsDescription.equals("svcGrpMemberServiceType")){
								svcGrpType = hashMap;
							}else if(keyAsDescription.equals("svcGrpMemberState")){
								svcGrpState = hashMap;
							}else if(keyAsDescription.equals("svcGrpMemberServerName")){
								svcGrpServerName = hashMap;
							}else if(keyAsDescription.equals("serviceGroupName")){
								serviceGroupName = hashMap;
							}else if(keyAsDescription.equals("serviceGroupState")){
								serviceGroupState = hashMap;
							}else if(keyAsDescription.equals("serviceGroupType")){
								serviceGroupType = hashMap;
							}
						}
						else{
							if(keyAsDescription.equals("Device Object ID")){
								result.put(keyAsDescription, value);
								value = value.replaceAll("1.3.6.1.4.1.","");
								value = value.split("[.]")[0];
								//print("EnterpriseID : "+value);
								if(value == '5951'){
									result.put("blueprint","Citrix Netscaler");
								}
							}else if(keyAsDescription.equals("Device Name")){
								result.put("Host Name",value);
							}else{
								result.put(keyAsDescription, value);
							}

						}
					}
					catch(e)
					{
						e.rhinoException.printStackTrace();
					}
				}
			}
		}
	}



	var vServerKeys = vServerName.keySet();
	var vServerKeysItr = vServerKeys.iterator();
	var LoadBalancer_Map_Hash= new java.util.HashMap();


	var ServiceMember_Group_Hash= new java.util.HashMap();
	var service_Group_memberJson_Map= new java.util.HashMap();

	var serviceGroupNameKeys=serviceGroupName.keySet();

	while(vServerKeysItr.hasNext())
	{
		var vServerKey = vServerKeysItr.next();
		//print('loadbalancer vServerKey ' + vServerKey);
		//print('loadbalancer vServerName ' + vServerName.get(vServerKey));
		var LoadBalancer_Components=new java.util.ArrayList();
		var ServiceNameMapKeys=serviceNameMap.keySet();
		var ServiceNameMapKeyItr=ServiceNameMapKeys.iterator();
		while(ServiceNameMapKeyItr.hasNext())
		{
			var ServiceNameMapKey = ServiceNameMapKeyItr.next();
			if(ServiceNameMapKey.contains(vServerKey))
			{
				//print('loadbalancer ServiceNameMapKey ' + ServiceNameMapKey);
		        //print('loadbalancer serviceNameMap ' + serviceNameMap.get(ServiceNameMapKey));
				var serviceNameMap_value=serviceNameMap.get(ServiceNameMapKey);
				var rootOID_L =vServerKey;
				ServiceNameMapKey = ServiceNameMapKey.replaceAll(rootOID_L + ".", "");
				//print(" after oid altration :"+ ServiceNameMapKey);

				if(serviceNameMap_value.contains('?'))
				{
					//print('loadbalancer serviceNameMap serviceNameMap_value ' + serviceNameMap_value);
					var serviceGroupName_map_value_split=serviceNameMap_value.split('[?]');
					//print('loadbalancer serviceNameMap serviceGroupName_map_value_split ' + serviceGroupName_map_value_split[0]);
					var serviceGroupNameKeys_itr_inside=serviceGroupNameKeys.iterator();
					while(serviceGroupNameKeys_itr_inside.hasNext())
					{
						var serviceGroupNameKey=serviceGroupNameKeys_itr_inside.next();
						var serviceGroupNameValue=serviceGroupName.get(serviceGroupNameKey);
						//print('loadbalancer serviceNameMap  serviceGroupNameValue  ' + serviceGroupNameValue);
						if(serviceGroupNameValue.equals(serviceGroupName_map_value_split[0]))
						{
							//print('loadbalancer serviceNameMap  serviceGroupNameValue equals ' + serviceGroupNameKey);
							if(!LoadBalancer_Components.contains(serviceGroupNameKey))
							{
								var serviceGroupNameKey_membername=serviceGroupNameKey+"."+ServiceNameMapKey;
								LoadBalancer_Components.add(serviceGroupNameKey_membername);
								ServiceMember_Group_Hash.put(serviceGroupNameKey_membername,serviceGroupNameKey);
							}
							if(!service_Group_memberJson_Map.containsKey(serviceGroupNameKey))
							{
								service_Group_memberJson_Map.put(serviceGroupNameKey,new java.util.ArrayList());
							}

						}
						else
						{
							//print('loadbalancer serviceNameMap  serviceGroupNameValue not equals ' + serviceGroupNameKey);
						}
					}
				}
				else
				{
					LoadBalancer_Components.add(ServiceNameMapKey);
				}

			}

		}
		LoadBalancer_Map_Hash.put(vServerKey,LoadBalancer_Components);
	}
	//print(" LoadBalancer_Map_Hash : "+LoadBalancer_Map_Hash);
	//print(" ServiceMember_Group_Hash : "+ServiceMember_Group_Hash);
	//print(" service_Group_memberJson_Map : "+service_Group_memberJson_Map);

	var vServerKeys_Name = vServerName.keySet();
	var vServerKeysItr_Name = vServerKeys_Name.iterator();
	var lbJsonArray = mapper.createArrayNode();
	var serviceName_Key_Set=serviceName.keySet();
	var svcGrpMemberKeys = svcGrpMember.keySet();



	while(vServerKeysItr_Name.hasNext())
	{
		var vServerKey_Name = vServerKeysItr_Name.next();
		var serviceGroupJsonArray = mapper.createArrayNode();
		var serviceJsonArray = mapper.createArrayNode();
		//print('loadbalancer ' + vServerName.get(vServerKey_Name));

		var lbJson = mapper.createObjectNode();

		lbJson.put("IP Address", vServerIPAddress.get(vServerKey_Name));
		lbJson.put("Asset Name", vServerName.get(vServerKey_Name)+"@"+vServerIPAddress.get(vServerKey_Name));
		lbJson.put("Type", getVServerTypeOrServiceTypeFromID(vServerType.get(vServerKey_Name)));
		lbJson.put("Load Balancer Port", vServerPort.get(vServerKey_Name));
		lbJson.put("Load Balancer State", getServiceOrServerStateFromID(vServerState.get(vServerKey_Name)));
		lbJson.put("Load Balancing Method", getLoadBalancingMethodFromId(lbMethod.get(vServerKey_Name)));

		var LoadBalancer_Components_List=LoadBalancer_Map_Hash.get(vServerKey_Name);
		//var svcGrpMemberJsonArray = new org.json.simple.JSONArray();
		//print('LoadBalancer_Components ' + LoadBalancer_Components_List);



		for(var i=0;i<LoadBalancer_Components_List.size();i++)
		{
			var LoadBalancer_Component=LoadBalancer_Components_List.get(i);
			if(serviceName_Key_Set.contains(LoadBalancer_Component))
			{
				var serviceJson = mapper.createObjectNode();
				serviceJson.put("Asset Name", vServerName.get(vServerKey_Name) + "@" + serviceIPAddress.get(LoadBalancer_Component));
				serviceJson.put("Service Name", serviceName.get(LoadBalancer_Component));
				serviceJson.put("IP Address", serviceIPAddress.get(LoadBalancer_Component));
				serviceJson.put("Service Port", servicePort.get(LoadBalancer_Component));
				serviceJson.put("Service Type", getVServerTypeOrServiceTypeFromID(serviceType.get(LoadBalancer_Component)));
				serviceJson.put("Service State", getServiceOrServerStateFromID(serviceState.get(LoadBalancer_Component)));
	      		serviceJsonArray.add(serviceJson);
			}
			else if(svcGrpMemberKeys.contains(LoadBalancer_Component))
			{
				var memberJson = mapper.createObjectNode();
				memberJson.put("Service Port", svcGrpPort.get(LoadBalancer_Component));
				memberJson.put("IP Address", svcGrpIpAddress.get(LoadBalancer_Component));
			    memberJson.put("Asset Name", svcGrpServerName.get(LoadBalancer_Component)+"@"+svcGrpIpAddress.get(LoadBalancer_Component));
			    memberJson.put("Server State", getServiceOrServerStateFromID(svcGrpState.get(LoadBalancer_Component)));
				//svcGrpMemberJsonArray.add(memberJson);
				if(ServiceMember_Group_Hash.containsKey(LoadBalancer_Component))
				{
					var group_Name=ServiceMember_Group_Hash.get(LoadBalancer_Component);
					if(service_Group_memberJson_Map.containsKey(group_Name))
					{
						var  memberJson_Array=service_Group_memberJson_Map.get(group_Name);
						memberJson_Array.add(memberJson);
						service_Group_memberJson_Map.put(group_Name,memberJson_Array);
					}
				}
			}
		}
		//print("service_Group_memberJson_Map : "+service_Group_memberJson_Map);

		var svcGrpKeys = serviceGroupName.keySet();
	    var svcGrpKeysItr = svcGrpKeys.iterator();
	    var svcGrpJsonArray = mapper.createArrayNode();

		while(svcGrpKeysItr.hasNext())
		{
			var svcGrpKey = svcGrpKeysItr.next();
			var svcGrpJson = mapper.createObjectNode();

			if(service_Group_memberJson_Map.containsKey(svcGrpKey))
			{
				var  memberJson_Array_listing=service_Group_memberJson_Map.get(svcGrpKey);
				if(memberJson_Array_listing.size()>0)
				{
					var svcGrpMemberJsonArray = mapper.createArrayNode();
				    for(var j=0;j<memberJson_Array_listing.size();j++)
				    {
					   svcGrpMemberJsonArray.add(memberJson_Array_listing.get(j));
				    }
				    svcGrpJson.put("Asset Name", serviceGroupName.get(svcGrpKey));
		            svcGrpJson.put("Service Group", serviceGroupName.get(svcGrpKey));
		            svcGrpJson.put("Service State", getServiceOrServerStateFromID(serviceGroupState.get(svcGrpKey)));
		            svcGrpJson.put("Service Type", getVServerTypeOrServiceTypeFromID(serviceGroupType.get(svcGrpKey)));
				    svcGrpJson.set("Netscaler Node", svcGrpMemberJsonArray);

				}

			}
			svcGrpJsonArray.add(svcGrpJson);
		}

		serviceGroupJsonArray.add(svcGrpJson);

		lbJson.set("Netscaler Service Group", serviceGroupJsonArray);
		lbJson.set("Netscaler Service", serviceJsonArray);
		//print("<<end>>");
		lbJsonArray.add(lbJson);

	}
	result.set("Load Balancer", lbJsonArray);
	print(result);
	return result.toString();
}

function checkValidJSON(item) {

	try {
		item = JSON.parse(item);
	} catch (e) {
		return false;
	}

	if (typeof item === "object" && item !== null && typeof item !== "number") {
		return true;
	}

	return false;
}

function OIDtoPropertyMapping() {
	return {
		"1.3.6.1.2.1.1.1.0" : "Description",
		"1.3.6.1.2.1.1.2.0" : "Device Object ID",
		"1.3.6.1.2.1.1.3.0" : "Uptime",
		"1.3.6.1.2.1.1.4.0" : "Device Contact",
		"1.3.6.1.2.1.1.5.0" : "Device Name",
		"1.3.6.1.2.1.1.6.0" : "Device Location",
		"1.3.6.1.2.1.25.1.2.0" : "OS Local Date Time",
		"1.3.6.1.2.1.25.2.2.0" : "RAM(MB)",
		"1.3.6.1.2.1.25.2.3.1.1" : "Storage Index",
		"1.3.6.1.2.1.25.2.3.1.3" : "Storage Labels",
		"1.3.6.1.2.1.25.2.3.1.2" : "Storage Type",
		"1.3.6.1.2.1.25.2.3.1.4" : "Storage Allocation Unit",
		"1.3.6.1.2.1.25.2.3.1.5" : "Storage Size",
		"1.3.6.1.2.1.25.2.3.1.6" : "Storage Used",
		"1.3.6.1.2.1.25.6.3.1.1" : "Software Index",
		"1.3.6.1.2.1.25.6.3.1.2" : "Software Name",
		"1.3.6.1.2.1.25.6.3.1.4" : "Software Type",
		"1.3.6.1.2.1.25.6.3.1.5" : "Software Install Date",
		"1.3.6.1.2.1.25.4.2.1.2" : "Process Name",
		"1.3.6.1.2.1.25.4.2.1.5" : "Process Arguments",
		"1.3.6.1.2.1.2.2.1.6.2" : "MAC Address",
		"1.3.6.1.2.1.25.3.8.1.4" : "FS Type",
		"1.3.6.1.2.1.2.2.1.5" : "Network Speed",
		"1.3.6.1.2.1.2.2.1.1" : "Network ifIndex",
		"1.3.6.1.2.1.2.2.1.2" : "Network Adapter Name",
		"1.3.6.1.2.1.4.20.1.1" : "IP Address",
		"1.3.6.1.2.1.4.20.1.2" : "IP Interface Index",
		"1.3.6.1.2.1.4.20.1.3" : "Netmask",
		"1.3.6.1.2.1.2.2.1.6" : "Interface Physical Address",
		"1.3.6.1.2.1.25.3.8.1.2" : "Mount Point",
		"1.3.6.1.2.1.25.3.2.1.2" : "Device Type",
		"1.3.6.1.2.1.25.3.2.1.3" : "Device Description",
		"1.3.6.1.2.1.25.4.2.1.1" : "Process Index",
		"1.3.6.1.2.1.25.4.2.1.4" : "Process Command",
		"1.3.6.1.2.1.6.13.1.1" : "TCP Connection State",
		"1.3.6.1.2.1.6.13.1.2" : "TCP Local Address",
		"1.3.6.1.2.1.6.13.1.3" : "TCP Local Port",
		"1.3.6.1.2.1.6.13.1.4" : "TCP Remote Address",
		"1.3.6.1.2.1.6.13.1.5" : "TCP Remote Port",
		
		/* Citrix Netscalar*/
		"1.3.6.1.4.1.5951.4.1.1.1.0" : "System Build Version",
		"1.3.6.1.4.1.5951.4.1.1.2.0" : "IP Address",
		"1.3.6.1.4.1.5951.4.1.1.3.0" : "Netmask",
		"1.3.6.1.4.1.5951.4.1.1.4.0" : "System Mapped IP Address",
		"1.3.6.1.4.1.5951.4.1.1.5.0" : "System Mapped IP Address Range",
		"1.3.6.1.4.1.5951.4.1.1.6.0" : "System High Availability Mode",
		"1.3.6.1.4.1.5951.4.1.1.7.0" : "Default Gateway",
		"1.3.6.1.4.1.5951.4.1.1.8.0" : "System Current Mapped IP Count",
		"1.3.6.1.4.1.5951.4.1.1.9.0" : "System CustomID",
		"1.3.6.1.4.1.5951.4.1.1.10.0" : "System Hardware Version ID",
		"1.3.6.1.4.1.5951.4.1.1.11.0" : "System Hardware Version Description",
		"1.3.6.1.4.1.5951.4.1.1.12.0" : "System Total Config Changes",
		"1.3.6.1.4.1.5951.4.1.1.13.0" : "System Total Save Configs",
		"1.3.6.1.4.1.5951.4.1.1.14.0" : "System Hardware Serial Number",
		"1.3.6.1.4.1.5951.4.1.1.15.0" : "System Hardware Encoded Serial Number",
		"1.3.6.1.4.1.5951.4.1.1.16.0" : "System Model ID",
		"1.3.6.1.4.1.5951.4.1.2.1.1.1" : "Service Name",
		"1.3.6.1.4.1.5951.4.1.2.1.1.2" : "Service IP Address",
		"1.3.6.1.4.1.5951.4.1.2.1.1.3" : "Service Port",
		"1.3.6.1.4.1.5951.4.1.2.1.1.4" : "Service Type",
		"1.3.6.1.4.1.5951.4.1.2.1.1.5" : "Service State",
		"1.3.6.1.4.1.5951.4.1.2.2.1.1" : "Server Name",
		"1.3.6.1.4.1.5951.4.1.2.2.1.2" : "Server IP Address",
		"1.3.6.1.4.1.5951.4.1.2.2.1.3" : "Server State",
		"1.3.6.1.4.1.5951.4.1.2.2.1.5" : "Server Full Name",
		"1.3.6.1.4.1.5951.4.1.3.1.1.1" : "vServer Name",
		"1.3.6.1.4.1.5951.4.1.3.1.1.2" : "vServer IP Address",
		"1.3.6.1.4.1.5951.4.1.3.1.1.3" : "vServer Port",
		"1.3.6.1.4.1.5951.4.1.3.1.1.4" : "vServer Type",
		"1.3.6.1.4.1.5951.4.1.3.1.1.5" : "vServer State",
		"1.3.6.1.4.1.5951.4.1.3.2.1.9" : "serviceNameMap",
		"1.3.6.1.4.1.5951.4.1.3.2.1.10" : "vServerNameMap",
		"1.3.6.1.4.1.5951.4.1.2.7.1.1" : "svcGrpMemberGroupName",
		"1.3.6.1.4.1.5951.4.1.2.7.1.2" : "svcGrpMemberName",
		"1.3.6.1.4.1.5951.4.1.2.7.1.3" : "svcGrpMemberPrimaryIP", 
		"1.3.6.1.4.1.5951.4.1.2.7.1.4" : "svcGrpMemberPrimaryPort",
		"1.3.6.1.4.1.5951.4.1.2.7.1.5" : "svcGrpMemberServiceType",
		"1.3.6.1.4.1.5951.4.1.2.7.1.6" : "svcGrpMemberState",
		"1.3.6.1.4.1.5951.4.1.2.7.1.36" : "svcGrpMemberServerName",
		"1.3.6.1.4.1.5951.4.1.3.6.1.1" : "loadBalancingMethod",
		"1.3.6.1.4.1.5951.4.1.2.11.1.1" : "serviceGroupName",
		"1.3.6.1.4.1.5951.4.1.2.11.1.2" : "serviceGroupType",
		"1.3.6.1.4.1.5951.4.1.2.11.1.3" : "serviceGroupState",
		"recordId" : "recordId",
		"IP Address" : "IP Address",
		
		"1.3.6.1.4.1.3375.2.2.5.1.2.1.1" : "Pool Name",
		"1.3.6.1.4.1.3375.2.2.5.1.2.1.2" : "Load Balance Method",
		"1.3.6.1.4.1.3375.2.2.5.3.2.1.11" : "Pool Monitor State",
		"1.3.6.1.4.1.3375.2.2.5.5.2.1.5" : "Pool Status Description",
		"1.3.6.1.4.1.3375.2.2.5.1.2.1.27" : "Pool Description",
		"1.3.6.1.4.1.3375.2.2.5.1.2.1.8" : "Active Member Count",
		"1.3.6.1.4.1.3375.2.2.5.1.2.1.23" : "Total Member Count",
		"1.3.6.1.4.1.3375.2.2.5.1.2.1.17" : "Pool Monitor",
		"1.3.6.1.4.1.3375.2.2.5.3.2.1.3" : "Pool IP Address",
		"1.3.6.1.4.1.3375.2.2.5.3.2.1.1" : "Pool Name From Member",
		"1.3.6.1.4.1.3375.2.2.5.3.2.1.19" : "Node Name From Pool Member",
			
        "1.3.6.1.4.1.3375.2.2.5.4.3.1.1" : "Pool Name to map",
		"1.3.6.1.4.1.3375.2.2.5.4.3.1.28" : "Node Name from Pool",
			
		"1.3.6.1.4.1.3375.2.2.4.1.2.1.17" : "Node Name",
		//"1.3.6.1.4.1.3375.2.2.5.1.2.1.17" : "Node Monitor",
		"1.3.6.1.4.1.3375.2.2.5.3.2.1.6" : "Node Ratio",
		"1.3.6.1.4.1.3375.2.2.5.3.2.1.4" : "Node Port",
		"1.3.6.1.4.1.3375.2.2.5.3.2.1.10" : "Node Monitor State",
		"1.3.6.1.4.1.3375.2.2.4.1.2.1.2" : "Node IP Address",
		
		"1.3.6.1.4.1.3375.2.2.10.1.2.1.1" : "Virtual Server Name",
        "1.3.6.1.4.1.3375.2.2.10.1.2.1.3" : "Virtual IP Address",
		"1.3.6.1.4.1.3375.2.2.10.1.2.1.6" : "Virtual Port",
		"1.3.6.1.4.1.3375.2.2.10.1.2.1.5" : "Destination Address/Mask",
		"1.3.6.1.4.1.3375.2.2.10.1.2.1.19" : "Default Pool",
		"1.3.6.1.4.1.3375.2.2.10.5.1" : "Virtual Server Id",
		"1.3.6.1.4.1.3375.2.2.10.5.2.1.3" : "Type",
		"1.3.6.1.4.1.3375.2.2.10.1.1" : "Virtual Server Count",
		
		/* Power Distribution Unit (PDU) */
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.1" : "PDU number",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.2" : "PDU name",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.3" : "Operational status",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.4" : "Input voltage",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.5" : "Input current",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.6" : "Power(Watts)",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.7" : "Energy consumption (kWh)",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.8" : "Internal temperature sensor",
		
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1" : "Outlet number",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2" : "Outlet status (on/off)",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3" : "Outlet current",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4" : "Outlet Power (Watts)"
		
		
	};
}

function mapMonitorStateValues(data){
	var value = "";
	data = parseInt(data);
	switch(data){
		case 0 : value = "Unchecked";
		           break;
		case 1 : value = "Checking";
		           break;
		case 2 : value = "Inband";
		           break;   
		case 3 : value = "Forced Up";
		           break; 
		case 4 : value = "Up";
		           break;
	    case 19 : value = "Down";
		           break;
		case 20 : value = "Forced Down";
		           break;
		case 22 : value = "Irule Down";
		           break;
		case 23 : value = "Inband Down";
		           break; 
		case 24 : value = "Down Manual Resume";
		           break; 
		case 25 : value = "Disabled";
		           break;
		default : value = "";
		           break;                                                                  	                                                
	} 
	return value;
}

function getLoadBalancingMethodFromId(id){
	var idToLBMethodMap = {
		"1" : "Weighted Round Robin",
		"2" : "Least Connections",
		"3" : "Least Response",
		"4" : "Asynchronous MAC",
		"5" : "URL Hashed",
		"6" : "Domain Hashed",
		"7" : "Destination IP Hashed",
		"8" : "Source IP Hashed",
		"9" : "Least Bandwidth",
		"10" : "Least Packets",
		"11" : "Custom Load",
		"12" : "Token",
		"13" : "Static Proximity",
		"14" : "RTT",
		"15" : "Source IP Destination IP Hashed",
		"16" : "Source IP Source Port",
		"17" : "LRTM",
		"18" : "Call ID Hashed"
	};
	
	return idToLBMethodMap[id];
}

function getVServerTypeOrServiceTypeFromID(id){
	var idToServiceTypeMap = {
		"0" : "HTTP",
		"1" : "FTP",
		"2" : "TCP",
		"3" : "UDP",
		"4" : "SSL_BRIDGE",
		"5" : "MONITOR",
		"6" : "MONITOR_UDP",
		"7" : "NNTP",
		"8" : "HTTP_SERVER",
		"9" : "HTTP_CLIENT",
		"10" : "RPC_SERVER",
		"11" : "RPC_CLIENT",
		"12" : "NAT",
		"13" : "ANY",
		"14" : "SSL",
		"15" : "DNS",
		"16" : "ADNS",
		"17" : "SNMP",
		"18" : "HA",
		"19" : "MONITOR_PING",
		"20" : "SSL_OTHER_TCP",
		"21" : "AAA",
		"22" : "SECURE_MONITOR",
		"23" : "SSL_VPN_UDP",
		"24" : "RIP",
		"25" : "DNS_CLIENT",
		"26" : "RPC_SERVER",
		"27" : "RPC_CLIENT",
		"35" : "DHCRPA",
		"38" : "SIP_UDP",
		"43" : "DNS_TCP",
		"44" : "ADNSTCP",
		"45" : "RTSP",
		"47" : "PUSH",
		"48" : "SSL_PUSH",
		"49" : "DHCP_CLIENT",
		"50" : "RADIUS",
		"55" : "RDP",
		"56" : "MYSQL",
		"57" : "MSSQL",
		"67" : "DIAMETER",
		"68" : "SSL_DIAMETER",
		"69" : "TFTP",
		"81" : "TFTP",
		"82" : "SERVICE_UNKNOWN"
	};
	
	return idToServiceTypeMap[id];
}

function getServiceOrServerStateFromID(id){
	var idToStateMap = {
		"1" : "Down",
		"2" : "Unknown",
		"3" : "Busy",
		"4" : "Out Of Service",
		"5" : "Transition To Out Of Service",
		"7" : "Up",
		"8" : "Transition To Out Of Service Down"
	};
	
	return idToStateMap[id];
}


function getEMPropertyNameFromOID(oid) {
	var oidToEMPropertyMap = {
		"1.3.6.1.2.1.1.1.0" : "Description",
		"1.3.6.1.2.1.1.3.0" : "Uptime",
		"1.3.6.1.2.1.1.4.0" : "Device Contact",
		"1.3.6.1.2.1.1.5.0" : "Device Name",
		"1.3.6.1.2.1.1.6.0" : "Device Location",
		'1.3.6.1.2.1.2.2.1.2' : 'ifDescr',
		"1.3.6.1.2.1.25.3.2.1.3.1" : "1.3.6.1.2.1.25.3.2.1.3.1",
		"1.3.6.1.2.1.2.2.1.6.2" : "1.3.6.1.2.1.2.2.1.6.2"

	};

	return oidToEMPropertyMap[oid];

}

function firstLevelMapping(str) {
	var map = {
		"1.3.6.1.2.1.2.2.1.1" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.2" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.3" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.5" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.6" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.7" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.8" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.9" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.9" : "ifEntry",
		"1.3.6.1.2.1.2.2.1.22" : "ifEntry",
		"1.3.6.1.2.1.31.1.1.1.1" : "ifEntry",
		"1.3.6.1.2.1.31.1.1.1.15" : "ifEntry",
		"1.3.6.1.2.1.31.1.1.1.18" : "ifEntry",
		"1.3.6.1.2.1.4.20.1.1" : "ipAddrEntry",
		"1.3.6.1.2.1.4.20.1.2" : "ipAddrEntry",
		"1.3.6.1.2.1.4.20.1.3" : "ipAddrEntry",
		"1.3.6.1.2.1.4.20.1.4" : "ipAddrEntry",
		"1.3.6.1.2.1.4.22.1.1" : "ipNetToMediaEntry",
		"1.3.6.1.2.1.4.22.1.2" : "ipNetToMediaEntry",
		"1.3.6.1.2.1.4.22.1.3" : "ipNetToMediaEntry",
		"1.3.6.1.2.1.4.22.1.4" : "ipNetToMediaEntry",
		"1.3.6.1.2.1.25.3.2.1.3.1" : "1.3.6.1.2.1.25.3.2.1.3.1",
		"1.3.6.1.2.1.2.2.1.6.2" : "1.3.6.1.2.1.2.2.1.6.2",
		"1.3.6.1.2.1.47.1.1.1.1.11.1001":"1.3.6.1.2.1.47.1.1.1.1.11.1001",
		"1.3.6.1.2.1.17.4.3.1.1.240.178.229.130.236.25":"MAC Address",
		"1.3.6.1.4.1.12356.100.1.1.1.0":"1.3.6.1.4.1.12356.100.1.1.1.0",
		"1.3.6.1.4.1.8741.2.1.1.2.0":"1.3.6.1.4.1.8741.2.1.1.2.0",
		"1.3.6.1.2.1.17.4.3.1.1.192.66.208.248.166.193":"MAC Address",
		"1.3.6.1.4.1.2636.3.40.1.4.1.1.1" : "chassisMembersEntry",
		"1.3.6.1.4.1.9.9.380.1.1.8.0": "baseMacAddr",
		"1.3.6.1.2.1.43.5.1.1.17.1" : "Device Serial Number",
		"1.3.6.1.2.1.2.2.1.6.1":"MAC Address",
		"1.3.6.1.4.1.2001.1.1.1.1.11.1.10.45.0": "Device Serial Number",
		
		/* PDU OIDs - Group PDU-level properties */
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.1" : "pduEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.2" : "pduEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.3" : "pduEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.4" : "pduEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.5" : "pduEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.6" : "pduEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.7" : "pduEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.8" : "pduEntry",
		
		/* Outlet OIDs - Group outlet-level properties */
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1" : "outletEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2" : "outletEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3" : "outletEntry",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4" : "outletEntry"
	};
	return map[str];
}

function secondLevelMapping(str) {
	var map = {
		"1.3.6.1.2.1.2.2.1.1" : "ifIndex",
		"1.3.6.1.2.1.2.2.1.2" : "ifDescr",
		"1.3.6.1.2.1.2.2.1.3" : "ifType",
		"1.3.6.1.2.1.2.2.1.5" : "ifSpeed",
		"1.3.6.1.2.1.2.2.1.6" : "ifPhysAddress",
		"1.3.6.1.2.1.2.2.1.7" : "ifAdminStatus",
		"1.3.6.1.2.1.2.2.1.8" : "ifOperStatus",
		"1.3.6.1.2.1.2.2.1.9" : "ifLastChange",
		"1.3.6.1.2.1.2.2.1.22" : "ifSpecific",
		"1.3.6.1.2.1.4.20.1.1" : "ipAdEntAddr",
		"1.3.6.1.2.1.4.20.1.2" : "ipAdEntIfIndex",
		"1.3.6.1.2.1.4.20.1.3" : "ipAdEntNetMask",
		"1.3.6.1.2.1.4.20.1.4" : "ipAdEntBcastAddr",
		"1.3.6.1.2.1.4.22.1.1" : "ipNetToMediaIfIndex",
		"1.3.6.1.2.1.4.22.1.2" : "ipNetToMediaPhysAddress",
		"1.3.6.1.2.1.4.22.1.3" : "ipNetToMediaNetAddress",
		"1.3.6.1.2.1.4.22.1.4" : "ipNetToMediaType",
		"1.3.6.1.2.1.31.1.1.1.1" : "ifName",
		"1.3.6.1.2.1.31.1.1.1.15" : "ifHighSpeed",
		"1.3.6.1.2.1.31.1.1.1.18" : "ifAlias",
		"1.3.6.1.2.1.1.1.0" : "sysDescr",
		"1.3.6.1.2.1.1.2.0" : "sysObjectID",
		"1.3.6.1.2.1.1.3.0" : "sysUptime",
		"1.3.6.1.2.1.1.4.0" : "sysContact",
		"1.3.6.1.2.1.1.5.0" : "sysName",
		"1.3.6.1.2.1.1.6.0" : "sysLocation",
		"1.3.6.1.2.1.47.1.1.1.1.2.1" : "entPhysicalDescr",
		"1.3.6.1.2.1.47.1.1.1.1.3.1" : "entPhysicalVendorType",
		"1.3.6.1.2.1.47.1.1.1.1.5.1" : "entPhysicalClass",
		"1.3.6.1.2.1.47.1.1.1.1.7.1" : "entPhysicalName",
		"1.3.6.1.2.1.47.1.1.1.1.8.1" : "entPhysicalHardwareRev",
		"1.3.6.1.2.1.47.1.1.1.1.9.1" : "entPhysicalFirmwareRev",
		"1.3.6.1.2.1.47.1.1.1.1.10.1" : "entPhysicalSoftwareRev",
		"1.3.6.1.2.1.47.1.1.1.1.11.1" : "entPhysicalSerialNum",
		"1.3.6.1.2.1.47.1.1.1.1.12.1" : "entPhysicalMfgName",
		"1.3.6.1.2.1.25.3.2.1.3.1" : "1.3.6.1.2.1.25.3.2.1.3.1",
		"1.3.6.1.2.1.2.2.1.6.2" : "1.3.6.1.2.1.2.2.1.6.2",
		"1.3.6.1.2.1.17.4.3.1.1":"1.3.6.1.2.1.17.4.3.1.1.240.178.229.130.236.25",
		"1.3.6.1.4.1.2636.3.40.1.4.1.1.1" : "chassMembInfo",
		
		/* Power Distribution Unit (PDU) OIDs */
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.1" : "pduNumber",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.2" : "pduName",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.3" : "pduOperationalStatus",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.4" : "pduInputVoltage",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.5" : "pduInputCurrent",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.6" : "pduPowerWatts",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.7" : "pduEnergyConsumption",
		"1.3.6.1.4.1.3711.24.1.1.7.3.1.1.8" : "pduTemperature",
		
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.1" : "outletNumber",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.2" : "outletStatus",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.3" : "outletCurrent",
		"1.3.6.1.4.1.3711.24.1.1.7.4.1.1.4" : "outletPowerWatts"


	};
	if (map[str] == undefined)
		return str;
	return map[str];
}

function thirdLevelMapping(str) {
	var map = {
		"ipAddrEntry" : "IPv4 Address",
		"ifEntry" : "Network Adapter",
		"macAddress":"MAC Address",
		"sysDescr" : "Device Description",
		"sysObjectID" : "Device Object ID",
		"sysContact" : "Device Contact",
		"sysName" : "Device Name",
		"sysUptime" : "Device Uptime",
		"sysLocation" : "Device Location",
		"entPhysicalDescr" : "Device Caption",
		"entPhysicalVendorType" : "System Object ID",
		"entPhysicalClass" : "Hardware Type",
		"entPhysicalHardwareRev" : "Hardware Revision",
		"entPhysicalFirmwareRev" : "Firmware Revision",
		"entPhysicalSoftwareRev" : "Software Revision",
		"entPhysicalSerialNum" : "Device Serial Number",
		"entPhysicalMfgName" : "Device Manufacturer Name",
		"ifIndex" : "Port Number",
		"ifDescr" : "Network Adapter Description",
		"ifType" : "Network Adapter Type",
		"ifSpeed" : "Network Speed",
		"ifPhysAddress" : "MAC Address",
		"ifAdminStatus" : "Admin Status",
		"ifOperStatus" : "Operator Status",
		"ifLastChange" : "Last Modified On",
		"ipAdEntAddr" : "IPv4 Address",
		"ipAdEntIfIndex" : "IPv4 If Index",
		"ipAdEntNetMask" : "IPv4 Netmask",
		"ipAdEntBcastAddr" : "IPv4 Broadcast Address",
		"ipNetToMediaIfIndex" : "",
		"ipNetToMediaPhysAddress" : "",
		"ipNetToMediaNetAddress" : "",
		"ipNetToMediaType" : "",
		"ifName" : "Network Adapter Name",
		"ifHighSpeed" : "High Speed Enabled",
		"ifAlias" : "Network Adapter Alias",
		"ifMauIfIndex" : "undefined",
		"recordId" : "recordId",
		"ipaddress" : "IP Address",
		"1.3.6.1.2.1.25.3.2.1.3.1" : "Device Model Name",
		"1.3.6.1.2.1.2.2.1.6.2" : "MAC Address",
		/* HP Specific OID */
		"1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.1.0" : "Model Number",
		"1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.2.0" : "Device Model Name",
		"1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.3.0" : "Device Serial Number",
		/* Samsung Specific OID */
		"1.3.6.1.4.1.236.11.5.1.1.1.4.0" : "Device Serial Number",
		/* Digi Connect OID*/
		"1.3.6.1.4.1.332.11.6.1.1.0" : "Device Name",
		"1.3.6.1.4.1.332.11.6.1.2.0" : "MAC Address",
		"1.3.6.1.4.1.332.11.6.1.3.0" : "Firmware Revision",
		"1.3.6.1.4.1.332.11.6.1.4.0" : "Boot Version",
		"1.3.6.1.4.1.332.11.6.1.5.0" : "Post Version",
		"1.3.6.1.4.1.332.11.6.1.6.0" : "CPU Usage",
		"1.3.6.1.4.1.332.11.6.1.7.0" : "Device Uptime",
		"1.3.6.1.4.1.332.11.6.1.8.0" : "RAM(MB)",
		"1.3.6.1.4.1.332.11.6.1.9.0" : "Available Memory(GB)",
		"1.3.6.1.4.1.332.11.6.1.10.0" : "Memory Usage",
		"1.3.6.1.2.1.47.1.1.1.1.11.1001" : "Device Serial Number",
		"1.3.6.1.4.1.12356.100.1.1.1.0":"Device Serial Number",
		"1.3.6.1.4.1.8741.2.1.1.2.0":"Device Serial Number",
		"1.3.6.1.4.1.45.1.6.3.3.1.1.7.8.1.0":"Device Serial Number",
		"1.3.6.1.2.1.17.4.3.1.1.240.178.229.130.236.25":"MAC Address",
		"1.3.6.1.2.1.47.1.1.1.1.11.22":"Device Serial Number",
		"1.3.6.1.4.1.2636.3.1.3.0":"Device Serial Number",
		"1.3.6.1.2.1.47.1.1.1.1.13.67108992":"Device Serial Number",
        "1.3.6.1.2.1.2.2.1.6.1007":"MAC Address",
        "1.3.6.1.2.1.47.1.1.1.1.11.67108992":"Device Serial Number",
        "1.3.6.1.2.1.2.2.1.6.1090":"MAC Address",
        "1.3.6.1.2.1.47.1.1.1.1.11.67109120":"Device Serial Number",
        "1.3.6.1.4.1.14823.2.2.1.2.1.29.0":"Device Serial Number",
        "1.3.6.1.2.1.43.5.1.1.17.1" : "Device Serial Number",
        "1.3.6.1.2.1.2.2.1.6.1":"MAC Address",
        "1.3.6.1.4.1.2001.1.1.1.1.11.1.10.45.0": "Device Serial Number",
		
		/* Power Distribution Unit (PDU) Properties */
		"pduNumber" : "PDU number",
		"pduName" : "PDU name",
		"pduOperationalStatus" : "Operational status",
		"pduInputVoltage" : "Input voltage",
		"pduInputCurrent" : "Input current",
		"pduPowerWatts" : "Power(Watts)",
		"pduEnergyConsumption" : "Energy consumption (kWh)",
		"pduTemperature" : "Internal temperature sensor",
		
		"outletNumber" : "Outlet number",
		"outletStatus" : "Outlet status (on/off)",
		"outletCurrent" : "Outlet current",
		"outletPowerWatts" : "Outlet Power (Watts)"
	};
	return map[str];
}

function getPropertyIndex(outer, inner) {
	var stringToReplace = outer + ".";
	var rep = inner.replace(stringToReplace, "");
	return rep;
}

function hex2a(hexValue) {
	hexValue = hexValue.replaceAll(":", "");
	hexValue = hexValue.trim();
	var output = new java.lang.StringBuilder("");
	for (var i = 0; i < hexValue.length(); i += 2) {
		var str = hexValue.substring(i, i + 2);
		output.append((java.lang.Character)(java.lang.Integer.parseInt(str, 16)));
	}
	return output.toString();
}

function mapLoadBalanceKeysToValues(data){
	var value = "";
	data = parseInt(data);
	switch(data){
		case 0 : value = "Round Robin";
		         break;
		case 1 : value = "Ration Member";
		         break; 
		case 3 : value = "Observed Member";
		         break;
		case 4 :  value = "Predictive Member";
		         break;
		case 5 : value = "Ratio Node Address";
		         break; 
        case 6 : value = "Least Connection Address";
                 break;
        case 7 : value = "Fastest Node Address";
                 break;
        case 8 : value = "Observed Node Address";
                 break;
        case 9 : value = "Predictive Node Address";
                 break;
        case 10 : value = "Dynamic Ratio";
                 break; 
		case 11 : value = "Fastest App Response";
                 break;
        case 12 : value = "Least Sessions";
                 break; 
        case 13 : value = "Dynamic Ratio Member";
                 break; 
        case 14 : value = "l3 Addr";
                 break; 
        case 15 : value = "Weighted Least ConnMember";
                 break;
        case 16 : value = "Weighted Least ConnNode Addr";
                 break;  
        case 17 : value = "Ratio Session";
                 break; 
        default : value = "";
                  break;                                                                                     
	} 
	return value;
}

function convertHexToIP(hex) {
	var sp = hex.split(":");
	var ip = [];
	for (var i in sp) {
		var dec = parseInt(sp[i], 16);
		ip.push(dec);
	}
	return ip.join(".");
}


function getEntepriseIDFromSystemObjectID(systemObjectID) {
	if (systemObjectID == undefined)
		return "";
	// Expected as 1.3.6.1.4.1.43.xx.xx.xx format
	var str = systemObjectID.replace("1.3.6.1.4.1.", "");
	var spl = str.split("[.]");
	if (spl.length > 1)
		return spl[0];
	return "";
}
function getSoftwareType(typeValue) {
var softwareTypeMap = {
    1: "Unknown",
    2: "Operating System",
    3: "Device Driver",
    4: "Application",
    5: "System Software"
};
    return softwareTypeMap[typeValue] || "Unknown";
}
function extractVendorFromSoftwareName(softwareName) {
    if (!softwareName || softwareName.trim() === "") {
        return "";
    }

    var name = softwareName.toLowerCase().trim();

    var directVendorPatterns = {
        "microsoft": ["microsoft", "ms ", "windows", "office", "visual studio", "sql server", "sharepoint", "exchange"],
        "adobe": ["adobe", "acrobat", "photoshop", "illustrator", "flash", "reader"],
        "google": ["google", "chrome", "gmail", "drive"],
        "oracle": ["oracle", "java", "mysql", "virtualbox"],
        "mozilla": ["mozilla", "firefox", "thunderbird"],
        "apple": ["apple", "itunes", "quicktime", "safari"],
        "intel": ["intel", "intel(r)"],
        "nvidia": ["nvidia", "geforce", "cuda"],
        "amd": ["amd", "radeon", "ati"],
        "symantec": ["symantec", "norton", "endpoint protection"],
        "mcafee": ["mcafee", "total protection", "virusscan"],
        "vmware": ["vmware", "workstation", "player"],
        "citrix": ["citrix", "receiver", "workspace"],
        "dell": ["dell", "supportassist"],
        "hp": ["hp ", "hewlett", "hewlett-packard"],
        "lenovo": ["lenovo", "thinkpad", "ideapad"],
        "samsung": ["samsung"],
        "cisco": ["cisco", "webex", "anyconnect"],
        "zoom": ["zoom"],
        "slack": ["slack"],
        "spotify": ["spotify"],
        "skype": ["skype"],
        "winrar": ["winrar"],
        "7-zip": ["7-zip", "7zip"],
        "vlc": ["vlc", "videolan"],
        "notepad++": ["notepad++"],
        "git": ["git"],
        "python": ["python"],
        "node.js": ["node.js", "nodejs"],
        "docker": ["docker"],
        "postman": ["postman"],
        "jetbrains": ["intellij", "pycharm", "webstorm", "datagrip", "phpstorm"],
        "virima": ["virima", "virima discovery", "virima agent"]
    };

    for (var vendor in directVendorPatterns) {
        var patterns = directVendorPatterns[vendor];
        for (var i = 0; i < patterns.length; i++) {
            var pattern = escapeRegex(patterns[i].trim());
            var regex = new RegExp("\\b" + pattern + "\\b", "i");
            if (name.match(regex)) {
                return capitalizeVendorName(vendor);
            }
        }
    }

    var parts = softwareName.split(/[\s\-_]+/);
    if (parts.length >= 2) {
        var firstPart = parts[0].toLowerCase();
        firstPart = firstPart.replace(/[\d\.]+$/, ""); // Remove trailing version numbers
        firstPart = firstPart.replace(/(inc|corp|ltd|llc|co)\.?$/i, ""); // Remove company suffixes

        if (firstPart.length >= 3) { // Minimum vendor name length
            return capitalizeVendorName(firstPart);
        }
    }

    var parenthesesMatch = softwareName.match(/\(([^)]+)\)/);
    if (parenthesesMatch && parenthesesMatch[1]) {
        var vendorInParens = parenthesesMatch[1].trim();
        vendorInParens = vendorInParens.replace(/(inc|corp|ltd|llc|co)\.?$/i, "");
        if (vendorInParens.length >= 3) {
            return capitalizeVendorName(vendorInParens);
        }
    }

    return ""; // Unknown vendor
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeVendorName(vendor) {
    if (!vendor) return "";

    var specialCases = {
        "microsoft": "Microsoft",
        "adobe": "Adobe",
        "google": "Google",
        "oracle": "Oracle",
        "mozilla": "Mozilla",
        "apple": "Apple",
        "intel": "Intel",
        "nvidia": "NVIDIA",
        "amd": "AMD",
        "vmware": "VMware",
        "citrix": "Citrix",
        "jetbrains": "JetBrains",
        "virima": "Virima"
    };

    var lowerVendor = vendor.toLowerCase();
    if (specialCases[lowerVendor]) {
        return specialCases[lowerVendor];
    }

    return vendor.charAt(0).toUpperCase() + vendor.slice(1).toLowerCase();
}


var osPatterns = {
    'IOS-XE': ['IOS-XE', 'IOS XE'],
    'IOS-XR': ['IOS XR', 'IOS-XR'],
    'NX-OS': ['NX-OS'],
    'IOS': ['IOS'],
    'CatOS': ['CatOS'],
    'ASA OS': ['ASA']
};


function parseOSNameFromSysDescr(description) {

    var checkOrder = ['IOS-XE', 'IOS-XR', 'NX-OS', 'IOS', 'CatOS', 'ASA OS'];

    for (var i = 0; i < checkOrder.length; i++) {
        var osName = checkOrder[i];
        var patterns = osPatterns[osName];

        for (var j = 0; j < patterns.length; j++) {
            if (description.indexOf(patterns[j]) !== -1) {
                return osName;
            }
        }
    }
	var catalystMatch = /(Catalyst|C|WS-C)1([0-3])00/.exec(description);
    if (catalystMatch) {
        return 'Cisco Business Switch OS';
    }

    // 900 series routers = Classic IOS
    if (/(?:CISCO|C|ISR[\s-]?)9[0-9]{2}(?![0-9])/.test(description)) {
        return 'Cisco Classic IOS';
    }
    return '';
}
