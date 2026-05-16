filepath = "src/components/contracts/ContractWizard.tsx"
with open(filepath, 'r') as f:
    code = f.read()

# 1. Add onError handler right before onFormSubmit
on_error_code = """
  const onFormError = (errors: any) => {
    console.error("Validation Errors:", errors);
    addNotification('Validation Error', 'Please fill all required fields correctly.', 'error');
  };

  const onFormSubmit = (data: ContractFormData) => {
"""
code = code.replace("  const onFormSubmit = (data: ContractFormData) => {", on_error_code)

# 2. Update the handleSubmit call
code = code.replace("onSubmit={handleSubmit(onFormSubmit as any)}", "onSubmit={handleSubmit(onFormSubmit as any, onFormError)}")

# 3. Update addContract payload and add try-catch
old_add_contract = """        await addContract({
          ...({} as any),
          // contract_id: data.contractId,
          status: 'active' as any,
          // client_name: data.clientName,
          // client_phone: data.clientPhone,
          // client_address: data.clientAddress,
          // client_birth_date: data.clientBirthDate,
          // client_birth_place: data.clientBirthPlace,
          // driver_license_number: data.licenseNumber,
          // driver_license_date: data.licenseDate,
          // has_other_drivers: data.hasOtherDrivers,
          vehicle_id: data.vehicleId,
          // vehicle_make: data.vehicleMake,
          // vehicle_model: data.vehicleModel,
          // vehicle_year: data.vehicleYear,
          // vehicle_plate: data.vehiclePlate,
          // vehicle_start_mileage: data.vehicleStartMileage,
          // vehicle_registration_date: data.vehicleRegistrationDate,
          start_date: data.startDate,
          end_date: data.endDate,
          // pickup_location: data.pickupLocation,
          // return_location: data.returnLocation,
          total_days: data.rentalDurationDays,
          // insurance_option: data.insuranceOption,
          daily_rate: data.dailyRate,
          deposit_amount: data.deposit,
          // payment_method: data.paymentMethod,
          signature_url: data.signature,
          // initial_damages: data.initialDamages,
        });"""

new_add_contract = """        await addContract({
          ...({} as any),
          status: 'active' as any,
          client_id: selectedClientId!,
          vehicle_id: data.vehicleId,
          start_date: data.startDate,
          end_date: data.endDate,
          total_days: data.rentalDurationDays,
          daily_rate: data.dailyRate,
          deposit_amount: data.deposit,
          signature_url: data.signature,
        });"""

code = code.replace(old_add_contract, new_add_contract)

# 4. wrap in try/catch (it's actually already in try { ... } catch (e) { ... }? Wait, let's check)
