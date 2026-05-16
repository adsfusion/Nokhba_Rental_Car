import re

with open("src/components/fleet/FleetTable.tsx", "r") as f:
    code = f.read()

# Replace types
code = code.replace("make: string;", "brand: string;")
code = code.replace("plate: string;", "license_plate: string;")
code = code.replace("current_mileage: number;", "mileage: number;")
code = code.replace("photos: string[];", "images: string[];")

code = code.replace("make: '',", "brand: '',")
code = code.replace("plate: '',", "license_plate: '',")
code = code.replace("current_mileage: 0,", "mileage: 0,")
code = code.replace("photos: [],", "images: [],")

# Replace property accesses
code = code.replace("vehicle.make", "vehicle.brand")
code = code.replace("vehicle.plate", "vehicle.license_plate")
code = code.replace("vehicle.current_mileage", "vehicle.mileage")
code = code.replace("vehicle.photos", "vehicle.images")
code = code.replace("newVehicle.make", "newVehicle.brand")
code = code.replace("newVehicle.plate", "newVehicle.license_plate")
code = code.replace("newVehicle.current_mileage", "newVehicle.mileage")
code = code.replace("newVehicle.photos", "newVehicle.images")
code = code.replace("selectedVehicle.make", "selectedVehicle.brand")
code = code.replace("selectedVehicle.plate", "selectedVehicle.license_plate")
code = code.replace("selectedVehicle.current_mileage", "selectedVehicle.mileage")
code = code.replace("selectedVehicle.photos", "selectedVehicle.images")
code = code.replace("contract.vehicle_make", "contract.vehicles?.brand")
code = code.replace("contract.vehicle_model", "contract.vehicles?.model")

code = code.replace("make:", "brand:")
code = code.replace("plate:", "license_plate:")
code = code.replace("current_mileage:", "mileage:")

# Filter Status mappings
code = code.replace("'All' | 'Available' | 'In Use' | 'Maintenance'", "'All' | 'available' | 'rented' | 'maintenance'")
code = code.replace("status: 'Available',", "status: 'available',")
code = code.replace("=== 'Available'", "=== 'available'")
code = code.replace("=== 'In Use'", "=== 'rented'")
code = code.replace("=== 'Maintenance'", "=== 'maintenance'")

# Active contract mappings
code = code.replace("c.status === 'Active'", "c.status === 'active'")

# Fix mapping in select options
code = code.replace('value="Available">Available</option>', 'value="available">Available</option>')
code = code.replace('value="In Use">In Use</option>', 'value="rented">In Use</option>')
code = code.replace('value="Maintenance">Maintenance</option>', 'value="maintenance">Maintenance</option>')

code = code.replace("(['All', 'Available', 'In Use', 'Maintenance']", "(['All', 'available', 'rented', 'maintenance']")
code = code.replace("status === 'Available'", "status === 'available'")
code = code.replace("status === 'In Use'", "status === 'rented'")
code = code.replace("status === 'Maintenance'", "status === 'maintenance'")

# Type fix for newVehicle
code = code.replace("as Omit<Vehicle, 'id' | 'tenant_id' | 'created_at'>", "as any")

with open("src/components/fleet/FleetTable.tsx", "w") as f:
    f.write(code)

