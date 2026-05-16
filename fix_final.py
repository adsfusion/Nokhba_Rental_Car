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

def fix_add_client(code):
    code = code.replace("name: string;", "full_name: string;")
    code = code.replace("name: '',", "full_name: '',")
    code = code.replace("data.name", "data.full_name")
    code = code.replace('name="name"', 'name="full_name"')
    code = code.replace('id="name"', 'id="full_name"')
    code = code.replace("...formData,", "full_name: formData.full_name,\nphone: formData.phone,\naddress: formData.address,\ndriver_license_number: formData.driver_license_number,\ndriver_license_expiry: formData.driver_license_expiry,\n")
    code = code.replace("errors.name", "errors.full_name")
    code = code.replace("formData.birth_date", "''")
    code = code.replace("formData.birth_place", "''")
    return code
process("src/components/clients/AddClientModal.tsx", fix_add_client)

def fix_contract_list(code):
    code = code.replace("contract.vehicles", "(contract as any).vehicles")
    return code
process("src/components/contracts/ContractList.tsx", fix_contract_list)

def fix_contract_wizard(code):
    code = code.replace("status: 'Active',", "status: 'active',")
    return code
process("src/components/contracts/ContractWizard.tsx", fix_contract_wizard)

def fix_edit_client(code):
    code = code.replace("birth_date: data.clientBirthDate,", "// birth_date: data.clientBirthDate,")
    return code
process("src/components/contracts/EditClientModal.tsx", fix_edit_client)

def fix_fleet(code):
    code = code.replace("license_plate:", "license_plate:") # handled via newvehicleform 
    
    # NewVehicleForm needs to be updated manually
    code = code.replace("export interface NewVehicleForm {", "export interface NewVehicleForm {\n  mileage: number;\n  license_plate: string;")
    code = code.replace('value={selectedVehicle.fuel_type}', 'value={selectedVehicle.fuel_type || ""}')
    return code
process("src/components/fleet/FleetTable.tsx", fix_fleet)

def fix_return_modal(code):
    code = code.replace("return_fuel_level:", "// return_fuel_level:")
    code = code.replace("damage.images?.map((photo, i)", "damage.images?.map((photo: any, i: number)")
    code = code.replace("damage.photos?.map((photo, i)", "damage.photos?.map((photo: any, i: number)")
    return code
process("src/components/fleet/ReturnVehicleModal.tsx", fix_return_modal)

