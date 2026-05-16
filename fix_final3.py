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
    # Fix the form interface to match Client Omit
    code = re.sub(r"interface FormData \{[\s\S]*?\}", "interface FormData {\n  full_name: string;\n  phone: string;\n  address: string;\n  birth_date: string;\n  birth_place: string;\n  driver_license_number: string;\n  driver_license_expiry: string;\n}", code)
    code = code.replace("data.name", "data.full_name")
    code = code.replace("data.license_number", "data.driver_license_number")
    code = code.replace("data.license_date", "data.driver_license_expiry")
    code = code.replace("register('name'", "register('full_name'")
    code = code.replace('register("name"', 'register("full_name"')
    code = code.replace('register("license_number"', 'register("driver_license_number"')
    code = code.replace('register("license_date"', 'register("driver_license_expiry"')
    code = code.replace("errors.name", "errors.full_name")
    code = code.replace("errors.license_number", "errors.driver_license_number")
    code = code.replace("errors.license_date", "errors.driver_license_expiry")
    
    code = code.replace("name:", "full_name:")
    code = code.replace("license_number:", "driver_license_number:")
    code = code.replace("license_date:", "driver_license_expiry:")
    code = code.replace("birth_date:", "// birth_date:")
    code = code.replace("birth_place:", "// birth_place:")
    return code
process("src/components/clients/AddClientModal.tsx", fix_add_client)

def fix_contract_wizard(code):
    code = code.replace("status: 'Active'", "status: 'active'") 
    return code
process("src/components/contracts/ContractWizard.tsx", fix_contract_wizard)

def fix_fleet(code):
    code = re.sub(r"export interface NewVehicleForm \{[\s\S]*?\}", "export interface NewVehicleForm {\n  brand: string;\n  model: string;\n  year: number;\n  color: string;\n  license_plate: string;\n  daily_rate: number;\n  weekly_rate: number;\n  monthly_rate: number;\n  mileage: number;\n  images: string[];\n}", code)
    return code
process("src/components/fleet/FleetTable.tsx", fix_fleet)

def fix_return_modal(code):
    code = code.replace("return_notes:", "notes:")
    return code
process("src/components/fleet/ReturnVehicleModal.tsx", fix_return_modal)
