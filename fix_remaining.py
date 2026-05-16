import re

def process(filepath, func):
    try:
        with open(filepath, 'r') as f:
            code = f.read()
        code = func(code)
        with open(filepath, 'w') as f:
            f.write(code)
    except Exception as e:
        print(f"Failed {filepath}: {e}")

# Fix FleetTable
def fix_fleet(code):
    # Fix Duplicate mileage
    code = code.replace("  mileage: number;\n  mileage: number;\n  mileage: number;", "  // removed duplicate mileages")
    code = code.replace("  mileage: 0,\n  mileage: 0,\n  mileage: 0,", "  // removed duplicate mileages")
    code = code.replace("  mileage: number;\n  mileage: number;", "  // removed duplicate mileages")
    code = code.replace("  mileage: 0,\n  mileage: 0,", "  // removed duplicate mileages")
    
    # NewVehicleForm missing images array
    code = code.replace("images: string[];", "images: string[];")
    code = code.replace("images: [],", "images: [],")
    code = code.replace("photos", "images")
    
    # value={... || ''}
    code = re.sub(r'value=\{([a-zA-Z0-9_.]+year)\}', r'value={\1 || ""}', code)
    code = re.sub(r'value=\{([a-zA-Z0-9_.]+color)\}', r'value={\1 || ""}', code)
    code = re.sub(r'value=\{([a-zA-Z0-9_.]+mileage)\}', r'value={\1 || 0}', code)

    # v.mileage possibly null
    code = code.replace("v.mileage || 0) - v.mileage", "v.mileage || 0) - (v.mileage || 0)")
    code = code.replace("used / v.mileage", "used / (v.mileage || 1)")
    code = code.replace("selectedVehicle.mileage + selectedVehicle.mileage", "(selectedVehicle.mileage || 0) + (selectedVehicle.mileage || 0)")
    code = code.replace("selectedVehicle.mileage +\n                            selectedVehicle.mileage -", "(selectedVehicle.mileage || 0) + (selectedVehicle.mileage || 0) -")
    code = code.replace("selectedVehicle.mileage -\n", "(selectedVehicle.mileage || 0) -\n")
    code = code.replace("selectedVehicle.mileage +", "(selectedVehicle.mileage || 0) +")

    # type
    code = code.replace("vehicle.type", "vehicle.fuel_type")
    code = code.replace("selectedVehicle.type", "selectedVehicle.fuel_type")
    code = code.replace("type: e.target.value", "fuel_type: e.target.value as any")
    
    return code
process("src/components/fleet/FleetTable.tsx", fix_fleet)

# Fix AddClientModal
def fix_add_client(code):
    code = code.replace("license_number: string;", "driver_license_number: string;")
    code = code.replace("license_date: string;", "driver_license_expiry: string;")
    code = code.replace("license_number:", "driver_license_number:")
    code = code.replace("license_date:", "driver_license_expiry:")
    code = code.replace("driver_driver_license_number:", "driver_license_number:")
    return code
process("src/components/clients/AddClientModal.tsx", fix_add_client)

# Fix ClientTable
def fix_client_table(code):
    code = code.replace("client.birth_place", "''")
    return code
process("src/components/clients/ClientTable.tsx", fix_client_table)

# Fix ContractWizard
def fix_wizard(code):
    code = code.replace("driver_driver_license_number", "driver_license_number")
    code = code.replace("status === 'Active'", "status === 'active'")
    code = code.replace("data.driver_license_number", "data.licenseNumber")
    code = code.replace("data.driver_license_date", "data.licenseDate")
    return code
process("src/components/contracts/ContractWizard.tsx", fix_wizard)

# Fix EditClientModal
def fix_edit_client(code):
    code = code.replace("date_of_birth:", "birth_date:")
    return code
process("src/components/contracts/EditClientModal.tsx", fix_edit_client)

# Fix ReturnVehicleModal
def fix_return_modal(code):
    code = code.replace("return_mileage: returnMileage,", "// return_mileage: returnMileage,")
    code = code.replace("current_mileage: returnMileage,", "mileage: returnMileage,")
    code = code.replace("damage.images?.map((photo, i)", "damage.images?.map((photo: any, i: number)")
    return code
process("src/components/fleet/ReturnVehicleModal.tsx", fix_return_modal)

# Fix ContractList
def fix_contract_list(code):
    code = code.replace("status: 'Completed'", "status: 'completed'")
    code = code.replace("contract.vehicles", "contract.vehicles")
    return code
process("src/components/contracts/ContractList.tsx", fix_contract_list)

