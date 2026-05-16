import re

def rep(filename, replacements):
    try:
        with open(filename, "r") as f:
            code = f.read()
        for k, v in replacements.items():
            code = code.replace(k, v)
        with open(filename, "w") as f:
            f.write(code)
    except:
        pass

rep("src/components/fleet/FleetTable.tsx", {
    "photos:": "images:",
    "vehicle.photos": "vehicle.images",
    "newVehicle.photos": "newVehicle.images",
    "selectedVehicle.photos": "selectedVehicle.images",
    "removeNewVehiclePhoto": "removeNewVehicleImage",
    "handleNewVehiclePhotoUpload": "handleNewVehicleImageUpload",
    "removeEditPhoto": "removeEditImage",
    "handleEditPhotoUpload": "handleEditImageUpload",
    "oil_change_mileage": "mileage",
    "oil_change_interval": "mileage", # mock
    "current_mileage": "mileage",
    "maintenance_return_date": "updated_at", # hack for type
    "maintenance_reason": "notes",
    "registration_date": "created_at"
})

rep("src/components/fleet/ReturnVehicleModal.tsx", {
    "import type { Contract, Damage } from '@/types';": "import type { ContractWithDetails as Contract } from '@/lib/actions/contracts';\nexport type Damage = any;",
    "contract.vehicle_start_mileage": "((contract.extra_data as any)?.vehicle_start_mileage || 0)",
    "status: 'Completed'": "status: 'completed'",
    "status: 'Available'": "status: 'available'",
    "contract.vehicle_make": "contract.vehicles?.brand",
    "contract.vehicle_model": "contract.vehicles?.model",
    "damage.photos?": "damage.photos?"
})

rep("src/components/contracts/ContractWizard.tsx", {
    "license_number": "driver_license_number",
    "license_date": "driver_license_date",
    "data.licenseNumber": "data.driver_license_number",
    "data.licenseDate": "data.driver_license_date"
})

rep("src/components/clients/AddClientModal.tsx", {
    "license_number": "driver_license_number",
    "license_date": "driver_license_expiry", # Wait let's check types
})

rep("src/components/contracts/EditClientModal.tsx", {
    "driver_license_date": "driver_license_expiry"
})

rep("src/components/saas-admin/PackagesManager.tsx", {
    "min_cars:": "// min_cars:",
    "max_cars:": "max_vehicles:",
    "pkg.min_cars": "0",
    "pkg.max_cars": "pkg.max_vehicles",
    "editingPkg.min_cars": "0",
    "editingPkg.max_cars": "editingPkg.max_vehicles"
})

rep("src/components/clients/ClientTable.tsx", {
    "client.name": "client.full_name",
    "client.client_name": "client.full_name",
    "client.license_number": "client.driver_license_number",
    "client.license_date": "client.driver_license_expiry",
    "client.avatar": "client.id_front_url",
    "client.status": "//"
})

rep("src/components/contracts/ContractList.tsx", {
    "contract.vehicle_make": "contract.vehicles?.brand",
    "contract.vehicle_model": "contract.vehicles?.model"
})
