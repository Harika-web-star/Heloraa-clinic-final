
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Medication = {
  medication_name: string;
  dosage: string;
  frequency: string;
  instructions: string;
};

type PatientRecord = {
  id: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  previous_surgeries: string | null;
  family_medical_history: string | null;
};

const emptyMedication = (): Medication => ({
  medication_name: "",
  dosage: "",
  frequency: "",
  instructions: "",
});

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

const sectionClass =
  "space-y-5 border-b border-slate-100 pb-7 last:border-0 last:pb-0";

export default function PatientOnboardingPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [medicalConditions, setMedicalConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [previousSurgeries, setPreviousSurgeries] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");

  const [medications, setMedications] = useState<Medication[]>([
    emptyMedication(),
  ]);
  const [takesNoMedication, setTakesNoMedication] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPatientProfile() {
      try {
        const editMode =
          new URLSearchParams(window.location.search).get("edit") === "1";

        if (!cancelled) setIsEditMode(editMode);

        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        if (!user.email) {
          setError("Your account has no email address.");
          return;
        }

        setUserEmail(user.email);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profileError) {
          throw new Error(
            `Couldn't load your account: ${profileError.message}`
          );
        }

        if (!profile || profile.role !== "patient") {
          setError(
            "Your account could not be verified as a patient account. Please check your profile role in Supabase."
          );
          return;
        }

        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");

        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select(
            "id, date_of_birth, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, medical_conditions, allergies, previous_surgeries, family_medical_history"
          )
          .eq("profile_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (patientError) {
          throw new Error(
            `Couldn't load your patient details: ${patientError.message}`
          );
        }

        if (!patient) {
          if (editMode) {
            router.replace("/patient/onboarding");
            return;
          }

          setMedications([emptyMedication()]);
          setTakesNoMedication(false);
          return;
        }

        const savedPatient = patient as PatientRecord;

        setDateOfBirth(savedPatient.date_of_birth ?? "");
        setGender(savedPatient.gender ?? "");
        setBloodGroup(savedPatient.blood_group ?? "");
        setAddress(savedPatient.address ?? "");
        setEmergencyContactName(
          savedPatient.emergency_contact_name ?? ""
        );
        setEmergencyContactPhone(
          savedPatient.emergency_contact_phone ?? ""
        );
        setMedicalConditions(savedPatient.medical_conditions ?? "");
        setAllergies(savedPatient.allergies ?? "");
        setPreviousSurgeries(savedPatient.previous_surgeries ?? "");
        setFamilyHistory(savedPatient.family_medical_history ?? "");

        if (
          !editMode &&
          savedPatient.date_of_birth &&
          savedPatient.gender
        ) {
          router.replace("/patient");
          return;
        }

        const { data: savedMedications, error: medicationError } =
          await supabase
            .from("medications")
            .select("medication_name, dosage, frequency, instructions")
            .eq("patient_id", savedPatient.id)
            .eq("active", true);

        if (cancelled) return;

        if (medicationError) {
          throw new Error(
            `Couldn't load your medications: ${medicationError.message}`
          );
        }

        if (savedMedications && savedMedications.length > 0) {
          setMedications(
            savedMedications.map((medication) => ({
              medication_name: medication.medication_name ?? "",
              dosage: medication.dosage ?? "",
              frequency: medication.frequency ?? "",
              instructions: medication.instructions ?? "",
            }))
          );
          setTakesNoMedication(false);
        } else {
          setMedications([emptyMedication()]);
          setTakesNoMedication(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't load your profile. Please try again."
          );
        }
      } finally {
        if (!cancelled) setCheckingUser(false);
      }
    }

    loadPatientProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateMedication(
    index: number,
    field: keyof Medication,
    value: string
  ) {
    setMedications((current) =>
      current.map((medication, i) =>
        i === index ? { ...medication, [field]: value } : medication
      )
    );
  }

  function addMedication() {
    setMedications((current) => [...current, emptyMedication()]);
  }

  function removeMedication(index: number) {
    setMedications((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileReadError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileReadError) throw profileReadError;

      if (!profile || profile.role !== "patient") {
        throw new Error("We couldn't verify your patient profile.");
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq("id", user.id);

      if (profileUpdateError) throw profileUpdateError;

      const { data: existingPatient, error: patientReadError } =
        await supabase
          .from("patients")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();

      if (patientReadError) throw patientReadError;
      console.log("Form values before saving:", {
  dateOfBirth,
  gender,
  bloodGroup,
});
      const patientDetails = {
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        blood_group: bloodGroup || null,
        address: address.trim() || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
        medical_conditions: medicalConditions.trim() || null,
        allergies: allergies.trim() || null,
        previous_surgeries: previousSurgeries.trim() || null,
        family_medical_history: familyHistory.trim() || null,
      };
      console.log("Patient data being sent to Supabase:", patientDetails);
      let patientId: string;

      
if (existingPatient) {
  const {
    data: updatedPatient,
    error: patientUpdateError,
  } = await supabase
    .from("patients")
    .update(patientDetails)
    .eq("id", existingPatient.id)
    .select("id, date_of_birth, gender, blood_group")
    .maybeSingle();

    if (patientUpdateError) {
        throw new Error(
        `Could not update patient details: ${patientUpdateError.message}`
        );
    }

    if (!updatedPatient) {
        throw new Error(
        "No patient row was updated. Check your Supabase patients table UPDATE policy and whether the patient ID matches."
        );
    }

    patientId = updatedPatient.id;

    console.log("Updated patient details:", updatedPatient);
    }
    else {
        const { data: newPatient, error: patientInsertError } =
          await supabase
            .from("patients")
            .insert({
              profile_id: user.id,
              ...patientDetails,
            })
            .select("id")
            .single();

        if (patientInsertError) throw patientInsertError;

        patientId = newPatient.id;
      }

      const completedMedications = takesNoMedication
        ? []
        : medications
            .filter((medication) => medication.medication_name.trim())
            .map((medication) => ({
              patient_id: patientId,
              medication_name: medication.medication_name.trim(),
              dosage: medication.dosage.trim() || null,
              frequency: medication.frequency.trim() || null,
              instructions: medication.instructions.trim() || null,
              active: true,
            }));

      const { error: archiveError } = await supabase
        .from("medications")
        .update({ active: false })
        .eq("patient_id", patientId)
        .eq("active", true);

      if (archiveError) {
        throw new Error(
          `Couldn't update your medication list: ${archiveError.message}`
        );
      }

      if (completedMedications.length > 0) {
        const { error: medicationInsertError } = await supabase
          .from("medications")
          .insert(completedMedications);

        if (medicationInsertError) {
          throw new Error(
            `Your patient details were saved, but medications couldn't be saved: ${medicationInsertError.message}`
          );
        }
      }

      router.replace("/patient");
      router.refresh();
    } catch (err) {
      console.error("Patient onboarding failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save your details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">
          Loading your profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-bold tracking-widest text-teal-700">
            HELORAA CLINIC
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {isEditMode ? "Edit your patient profile" : "Your patient profile"}
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {isEditMode
              ? "Update your personal details and health information below."
              : "Share the details that will help your care team understand your needs. Medical history and medications are optional."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-slate-900">
              Personal details
            </h2>

            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name *
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
                maxLength={100}
                className={inputClass}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={userEmail}
                readOnly
                required
                className={`${inputClass} bg-slate-50`}
                aria-label="Registered email address"
              />
              <p className="mt-1 text-xs text-slate-500">
                Your account email is managed through sign-in.
              </p>
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone number (optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                maxLength={20}
                className={inputClass}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="dateOfBirth" className={labelClass}>
                  Date of birth *
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="gender" className={labelClass}>
                  Gender *
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bloodGroup" className={labelClass}>
                Blood group (optional)
              </label>
              <select
                id="bloodGroup"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={inputClass}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">I don't know</option>
              </select>
            </div>

            <div>
              <label htmlFor="address" className={labelClass}>
                Address (optional)
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                maxLength={500}
                className={inputClass}
                placeholder="Your residential address"
              />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-slate-900">
              Emergency contact
            </h2>
            <p className="text-sm text-slate-500">
              Optional contact details in case of an emergency.
            </p>

            <div>
              <label htmlFor="emergencyName" className={labelClass}>
                Contact person's name
              </label>
              <input
                id="emergencyName"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                maxLength={100}
                className={inputClass}
                placeholder="Name of a trusted contact"
              />
            </div>

            <div>
              <label htmlFor="emergencyPhone" className={labelClass}>
                Contact person's phone
              </label>
              <input
                id="emergencyPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                maxLength={20}
                className={inputClass}
                placeholder="Emergency contact number"
              />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-slate-900">
              Medical history
            </h2>
            <p className="text-sm text-slate-500">
              You can leave any or all of these fields blank.
            </p>

            <div>
              <label htmlFor="conditions" className={labelClass}>
                Existing medical conditions
              </label>
              <textarea
                id="conditions"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                rows={3}
                maxLength={3000}
                className={inputClass}
                placeholder="For example, asthma or diabetes"
              />
            </div>

            <div>
              <label htmlFor="allergies" className={labelClass}>
                Allergies
              </label>
              <textarea
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                maxLength={2000}
                className={inputClass}
                placeholder="Medication, food or other allergies"
              />
            </div>

            <div>
              <label htmlFor="surgeries" className={labelClass}>
                Previous surgeries
              </label>
              <textarea
                id="surgeries"
                value={previousSurgeries}
                onChange={(e) => setPreviousSurgeries(e.target.value)}
                rows={2}
                maxLength={2000}
                className={inputClass}
                placeholder="Include approximate dates if known"
              />
            </div>

            <div>
              <label htmlFor="familyHistory" className={labelClass}>
                Family medical history
              </label>
              <textarea
                id="familyHistory"
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                rows={2}
                maxLength={2000}
                className={inputClass}
                placeholder="Relevant family health conditions"
              />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-slate-900">
              Current medications
            </h2>
            <p className="text-sm text-slate-500">
              Optional. Add medicines you currently take, if any.
            </p>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={takesNoMedication}
                onChange={(e) => setTakesNoMedication(e.target.checked)}
                className="mt-1 h-4 w-4 accent-teal-700"
              />
              <span className="text-sm text-slate-800">
                I don't take any current medications
              </span>
            </label>

            {!takesNoMedication && (
              <div className="space-y-4">
                {medications.map((medication, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium text-slate-800">
                        Medication {index + 1}
                      </h3>

                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`medication-${index}`}
                        className={labelClass}
                      >
                        Medication name
                      </label>
                      <input
                        id={`medication-${index}`}
                        value={medication.medication_name}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            "medication_name",
                            e.target.value
                          )
                        }
                        maxLength={200}
                        className={inputClass}
                        placeholder="Enter medication name"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`dosage-${index}`}
                          className={labelClass}
                        >
                          Dosage
                        </label>
                        <input
                          id={`dosage-${index}`}
                          value={medication.dosage}
                          onChange={(e) =>
                            updateMedication(index, "dosage", e.target.value)
                          }
                          maxLength={100}
                          className={inputClass}
                          placeholder="As prescribed"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`frequency-${index}`}
                          className={labelClass}
                        >
                          Frequency
                        </label>
                        <input
                          id={`frequency-${index}`}
                          value={medication.frequency}
                          onChange={(e) =>
                            updateMedication(
                              index,
                              "frequency",
                              e.target.value
                            )
                          }
                          maxLength={100}
                          className={inputClass}
                          placeholder="As prescribed"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`instructions-${index}`}
                        className={labelClass}
                      >
                        Additional instructions
                      </label>
                      <textarea
                        id={`instructions-${index}`}
                        value={medication.instructions}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            "instructions",
                            e.target.value
                          )
                        }
                        rows={2}
                        maxLength={1000}
                        className={inputClass}
                        placeholder="Optional instructions"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMedication}
                  className="rounded-xl border border-teal-700 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
                >
                  + Add another medication
                </button>
              </div>
            )}
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-950 px-4 py-3.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving your details..."
                : isEditMode
                  ? "Save profile changes"
                  : "Save and continue"}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={() => router.push("/patient")}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}

            <p className="text-center text-xs leading-5 text-slate-500">
              Optional medical information can be added later. Please enter
              medication details as prescribed by your healthcare professional.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
