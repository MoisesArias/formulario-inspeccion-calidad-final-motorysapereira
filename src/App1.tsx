"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Loader2 } from "lucide-react";

interface FormData {
  [key: string]: string;
}

interface Observations {
  [key: string]: string;
}

const questions = [
  "Refrigerante Radiador",
  "Aceite Motor",
  "Caja Mecánica / Automática",
  "Dirección Hidráulica / Electro Asistida",
  "Lava Vidrios",
  "Líquido de Frenos / Embrague (si aplica)",
  "Ajuste y Limpieza Bornes / Batería",
  "Programación de Emisoras",
  "Limpieza Protector",
  "Iluminación Exterior / Interior",
  "Funcionamiento Pito",
  "Accionamiento Alarma",
  "Bloqueo de Puertas",
  "Testigos Luminosos",
  "Funcionamiento Elevavidrios",
  "Funcionamiento Espejos",
  "Cambio de Aceite y Filtro Motor",
  "Verificación de Extintor",
  "Ajuste Freno de Parqueo",
  "Funcionamiento Embrague",
  "Funcionamiento del Control de Cambios",
  "Fugas de Aceite del Motor",
  "Fugas de Aceite en la Caja",
  "Fugas del Refrigerante del Radiador",
  "Control Automático de Luces",
  "Funcionamiento Radio",
  "Ajuste Pernos Ruedas",
];

const answerOptions = [
  { value: "correcto", label: "Correcto" },
  { value: "deficiente", label: "Deficiente" },
  { value: "corregido", label: "Corregido" },
  { value: "no-aplica", label: "No Aplica" },
];

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwF-CjV5QYRg06_dJL_1dz4aluD-BWir6VsFx9gBtaKYSkW48XqyBZY08eT7T-4Dgc/exec";

export default function VehicleInspectionForm() {
  const [qualityControlName, setQualityControlName] = useState("");
  const [controlDate, setControlDate] = useState("");
  const [qualityControlOK, setQualityControlOK] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [observations, setObservations] = useState<Observations>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [observationErrors, setObservationErrors] = useState<Record<string, boolean>>({});
  const [qualityControlError, setQualityControlError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Auto-complete form when Quality Control OK is checked
  useEffect(() => {
    if (qualityControlOK) {
      const autoCompletedData: FormData = {};
      questions.forEach(question => {
        autoCompletedData[question] = "correcto";
      });
      setFormData(autoCompletedData);
      
      // Clear any existing observations and errors
      setObservations({});
      setObservationErrors({});
      setErrors({});
    }
  }, [qualityControlOK]);

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear observation if not "deficiente"
    if (value !== "deficiente") {
      setObservations((prev) => {
        const newObservations = { ...prev };
        delete newObservations[name];
        return newObservations;
      });
      setObservationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear main error
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleObservationChange = (name: string, value: string) => {
    setObservations((prev) => ({ ...prev, [name]: value }));
    
    // Clear observation error when user types
    if (observationErrors[name]) {
      setObservationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    const newObservationErrors: Record<string, boolean> = {};
    let isValid = true;
    
    // Validate quality control name and date
    if (!qualityControlName.trim()) {
      setQualityControlError(true);
      isValid = false;
    } else {
      setQualityControlError(false);
    }
    
    if (!controlDate) {
      setDateError(true);
      isValid = false;
    } else {
      setDateError(false);
    }
    
    // Only validate questions if Quality Control OK is not checked
    if (!qualityControlOK) {
      questions.forEach((question) => {
        // Validate main selection
        if (!formData[question]) {
          newErrors[question] = true;
          isValid = false;
        }
        
        // Validate observation if "deficiente" is selected
        if (formData[question] === "deficiente") {
          if (!observations[question] || observations[question].trim() === "") {
            newObservationErrors[question] = true;
            isValid = false;
          }
        }
      });
    }

    setErrors(newErrors);
    setObservationErrors(newObservationErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    
    // En tu handleSubmit (frontend)
    try {
      // Prepare data (igual que antes)
      const submissionData: Record<string, any> = {
        "Control Calidad": qualityControlName,
        "Fecha de Control": controlDate,
      };
      questions.forEach((question, index) => {
        const answer = formData[question] || (qualityControlOK ? "correcto" : "");
        submissionData[`Respuesta ${index + 1}`] = answer;
        submissionData[`Observación ${index + 1}`] = answer === "deficiente" ? (observations[question] || "") : "No Aplica";
      });

      // Llamamos al proxy de Vercel (misma origin) que a su vez llama al GAS
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      // Leemos la respuesta del proxy (que contiene lo que devolvió GAS)
      const result = await response.json();

      if (response.ok && result.ok) {
        // Éxito
        setSubmitSuccess(true);
        setIsSubmitted(true);
      } else {
        // Falló por algo (GAS devolvió error o el status no es 200)
        const errMsg = result?.data?.message || result?.error || `HTTP ${result?.status || response.status}`;
        setSubmitError("Error al guardar: " + errMsg);
      }
    } catch (error) {
      console.error("Error en submit:", error);
      setSubmitError("Hubo un error al enviar el formulario. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }

  };

  const resetForm = () => {
    setQualityControlName("");
    setControlDate("");
    setQualityControlOK(false);
    setFormData({});
    setObservations({});
    setErrors({});
    setObservationErrors({});
    setQualityControlError(false);
    setDateError(false);
    setIsSubmitted(false);
    setSubmitError("");
    setSubmitSuccess(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Control de Calidad Final Completado</h2>
            <p className="text-gray-600 mb-6">
              El control de calidad del vehículo ha sido registrado exitosamente.
            </p>
            <Button onClick={resetForm} className="w-full max-w-xs">
              Realizar Nuevo Control de Calidad
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Control de Calidad Final
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Por favor seleccione el estado de cada componente del vehículo
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Quality Control and Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-blue-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="qualityControl" className="text-sm font-medium text-gray-700">
                    Control Calidad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="qualityControl"
                    value={qualityControlName}
                    onChange={(e) => {
                      setQualityControlName(e.target.value);
                      if (qualityControlError) setQualityControlError(false);
                    }}
                    placeholder="Ingrese el nombre del control de calidad"
                    className={qualityControlError ? "border-red-500" : ""}
                  />
                  {qualityControlError && (
                    <p className="text-red-500 text-sm">El nombre del control de calidad es requerido</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                    Fecha de Control <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={controlDate}
                    onChange={(e) => {
                      setControlDate(e.target.value);
                      if (dateError) setDateError(false);
                    }}
                    className={dateError ? "border-red-500" : ""}
                  />
                  {dateError && (
                    <p className="text-red-500 text-sm">La fecha de control es requerida</p>
                  )}
                </div>
              </div>
              
              {/* Quality Control OK Checkbox */}
              <div className="flex items-center space-x-2 mb-6 p-4 bg-green-50 rounded-lg">
                <Checkbox
                  id="qualityControlOK"
                  checked={qualityControlOK}
                  onCheckedChange={(checked) => setQualityControlOK(checked as boolean)}
                />
                <Label 
                  htmlFor="qualityControlOK" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Control Calidad OK (Marcar para autocompletar todas las respuestas como "Correcto")
                </Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {questions.map((question, index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-sm font-bold text-gray-800">
                      {index + 1}. {question} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData[question] || ""}
                      onValueChange={(value) => handleSelectChange(question, value)}
                      disabled={qualityControlOK}
                    >
                      <SelectTrigger className={errors[question] ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccione una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {answerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[question] && !qualityControlOK && (
                      <p className="text-red-500 text-sm">Este campo es requerido</p>
                    )}
                    
                    {/* Observations field - only shown when "Deficiente" is selected */}
                    {formData[question] === "deficiente" && (
                      <div className="mt-3">
                        <Label htmlFor={`observation-${index}`} className="text-sm font-medium text-gray-700">
                          Observaciones <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id={`observation-${index}`}
                          value={observations[question] || ""}
                          onChange={(e) => handleObservationChange(question, e.target.value)}
                          placeholder="Por favor describa la deficiencia encontrada"
                          className={`mt-1 ${observationErrors[question] ? "border-red-500" : ""}`}
                          disabled={qualityControlOK}
                        />
                        {observationErrors[question] && !qualityControlOK && (
                          <p className="text-red-500 text-sm mt-1">Las observaciones son requeridas cuando la respuesta es "Deficiente"</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {submitError && (
                <div className="text-red-500 text-center py-2">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="text-green-600 text-center py-2">
                  ¡Datos guardados correctamente!
                </div>
              )}

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Registrar Control de Calidad"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}