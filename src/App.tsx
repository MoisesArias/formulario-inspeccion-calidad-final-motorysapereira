"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Loader2, CheckCircle, AlertTriangle, XCircle, MinusCircle } from "lucide-react";

interface FormData {
  [key: string]: string;
}

interface Observations {
  [key: string]: string;
}

const questions = [
  "Verificacion de operaciones solicitadas por el cliente",
  "Comprobar el vehiculo respecto a medidas",
  "Revision torque de pernos, presion de neumaticos y labrado",
  "Revisar los niveles de liquidos y estados de los depositos",
  "Calidad de liquidos de frenos",
  "Vano Motor: Control visual de los tubos flexibles",
  "Comprobar limpia brisas y eyectores ajustados",
  "Espejos retrovisores",
  "Comprobar daños de transporte en lunestas, pintura, piezas",
  "Inspeccion exterior (golpes, rayones)",
  "Reprogramación de Mantenimiento",
  "Revisar radio (Sintonizacion de emisoras)",
  "Control visual de habitaculo: Estado y daños",
  "Revisar funcionamiento del aire acondicionado",
  "Inspeccion luces del vehiculo",
  "Control de funcionamiento de prueba de ruta",
  "Funcionamiento y estado de cinturones de seguridad",
  "Inspeccion limpieza del vehiculo",
  "Inspeccion testigos de tablero de instrumentos",
  "Hoja de mantenimiento",
  "Formato solicitud y cotizacion de repuesto",
  "Consulta en EVA / Codificacion WIS - ASRA (Ejecución KDM y RECALL)",
  "Formato FVVT (Formato diagnostico)",
  "Test de entrada y test de salida a las horas adecuadas",
  "Documentos de Garantias",
  "Orden de Servicio (Firmas OT, HD, Factura, Check List MTO)",
];

const answerOptions = [
  { value: "cumple", label: "Cumple", icon: CheckCircle, color: "bg-green-500" },
  { value: "no-cumple", label: "No Cumple", icon: XCircle, color: "bg-red-500" },
  { value: "n-a", label: "N/A", icon: MinusCircle, color: "bg-gray-500" },
];

const liquidOptions = [
  { value: "buen-estado", label: "Buen Estado", icon: CheckCircle, color: "bg-green-500" },
  { value: "atencion-pronto", label: "Atencion Pronto", icon: AlertTriangle, color: "bg-yellow-600" },
  { value: "cambio-inmediato", label: "Cambio Inmediato", icon: XCircle, color: "bg-red-500" },
  { value: "n-a", label: "N/A", icon: MinusCircle, color: "bg-gray-500" },
];

export default function VehicleInspectionForm() {
  const [responsible, setResponsible] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [controlDate, setControlDate] = useState("");
  const [qualityControlOK, setQualityControlOK] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [observations, setObservations] = useState<Observations>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [observationErrors, setObservationErrors] = useState<Record<string, boolean>>({});
  const [responsibleError, setResponsibleError] = useState(false);
  const [plateError, setPlateError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Refs for scrolling to errors
  const responsibleRef = useRef<HTMLDivElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-complete form when Quality Control OK is checked
  useEffect(() => {
    if (qualityControlOK) {
      const autoCompletedData: FormData = {};
      questions.forEach(question => {
        // For liquid-related questions, use "buen-estado", otherwise "cumple"
        const isLiquidQuestion = question.includes("liquidos") || 
                                question.includes("Calidad de") || 
                                question.includes("Estado y daños") || 
                                question.includes("aire acondicionado") || 
                                question.includes("tablero de instrumentos");
        autoCompletedData[question] = isLiquidQuestion ? "buen-estado" : "cumple";
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
    
    // Clear observation if not an observation-triggering value
    const shouldShowObservation = value === "no-cumple" || value === "atencion-pronto" || value === "cambio-inmediato";
    if (!shouldShowObservation) {
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

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow letters and numbers, convert to uppercase
    const formattedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setPlateNumber(formattedValue);
    
    // Clear error when user types
    if (plateError) setPlateError(false);
  };

  const scrollToError = (elementRef: React.RefObject<HTMLDivElement>) => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    const newObservationErrors: Record<string, boolean> = {};
    let firstErrorRef: React.RefObject<HTMLDivElement | null> | null = null;
    let isValid = true;
    
    // Validate responsible
    if (!responsible.trim()) {
      setResponsibleError(true);
      if (!firstErrorRef) firstErrorRef = responsibleRef;
      isValid = false;
    } else {
      setResponsibleError(false);
    }
    
    // Validate plate number
    if (!plateNumber.trim()) {
      setPlateError(true);
      if (!firstErrorRef) firstErrorRef = plateRef;
      isValid = false;
    } else {
      setPlateError(false);
    }
    
    // Validate date
    if (!controlDate) {
      setDateError(true);
      if (!firstErrorRef) firstErrorRef = dateRef;
      isValid = false;
    } else {
      setDateError(false);
    }
    
    // Only validate questions if Quality Control OK is not checked
    if (!qualityControlOK) {
      questions.forEach((question, index) => {
        // Validate main selection
        if (!formData[question]) {
          newErrors[question] = true;
          const refEl = questionRefs.current[index];
          if (!firstErrorRef && refEl) firstErrorRef = { current: refEl };
          isValid = false;
        }
        
        // Validate observation if observation-triggering value is selected
        const shouldShowObservation = formData[question] === "no-cumple" || 
                                     formData[question] === "atencion-pronto" || 
                                     formData[question] === "cambio-inmediato";
        
        if (shouldShowObservation) {
          if (!observations[question] || observations[question].trim() === "") {
            newObservationErrors[question] = true;
            if (!firstErrorRef) firstErrorRef = { current: questionRefs.current[index] };
            isValid = false;
          }
        }
      });
    }

    setErrors(newErrors);
    setObservationErrors(newObservationErrors);
    
    // Scroll to first error if any
    if (firstErrorRef && firstErrorRef.current) {
      setTimeout(() => {
        scrollToError(firstErrorRef as React.RefObject<HTMLDivElement>);
      }, 100);
    }
    
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
    
    try {
      // Prepare data for submission
      const submissionData: any = {
        "Formulario": "motorysapereira",
        "Responsable": responsible,
        "Placa Vehiculo": plateNumber,
        "Fecha de Control": controlDate,
      };
      
      // Add questions and answers
      questions.forEach((question, index) => {
        const answer = formData[question] || (qualityControlOK ? 
          (question.includes("liquidos") || 
           question.includes("Calidad de") || 
           question.includes("Estado y daños") || 
           question.includes("aire acondicionado") || 
           question.includes("tablero de instrumentos") ? 
           "buen-estado" : "cumple") : "");
        
        submissionData[`Pregunta ${index + 1}`] = question;
        submissionData[`Respuesta ${index + 1}`] = answer;
        
        // Add observations
        const shouldShowObservation = answer === "no-cumple" || 
                                     answer === "atencion-pronto" || 
                                     answer === "cambio-inmediato";
        
        if (shouldShowObservation) {
          submissionData[`Observación ${index + 1}`] = observations[question] || "";
        } else {
          submissionData[`Observación ${index + 1}`] = "No Aplica";
        }
      });
      
      // Send data to Google Sheets
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });
      
      // Check response
      const result = await response.json();

      if (response.ok && result.ok) {
        setSubmitSuccess(true);
        setIsSubmitted(true);
      } else {
        const errMsg = result?.data?.message || result?.error || `HTTP ${result?.status || response.status}`;
        setSubmitError("Error al guardar: " + errMsg);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError("Hubo un error al enviar el formulario. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setResponsible("");
    setPlateNumber("");
    setControlDate("");
    setQualityControlOK(false);
    setFormData({});
    setObservations({});
    setErrors({});
    setObservationErrors({});
    setResponsibleError(false);
    setPlateError(false);
    setDateError(false);
    setIsSubmitted(false);
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const getButtonClass = (selectedValue: string, optionValue: string, baseColor: string) => {
    const isSelected = selectedValue === optionValue;
    const baseClasses = "flex-1 py-3 px-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1";
    
    if (isSelected) {
      return `${baseClasses} text-white ${baseColor} shadow-md transform scale-105`;
    }
    return `${baseClasses} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
  };

  const getSelectedOption = (question: string) => {
    const isLiquidQuestion = question.includes("liquidos") || 
                            question.includes("Calidad de") || 
                            question.includes("Estado y daños") || 
                            question.includes("aire acondicionado") || 
                            question.includes("tablero de instrumentos");
    
    const options = isLiquidQuestion ? liquidOptions : answerOptions;
    const selectedValue = formData[question];
    
    return options.find(option => option.value === selectedValue) || null;
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
    <div 
      className="min-h-screen py-12 px-4 sm:px-6"
      style={{
        backgroundImage: "url('/img/fondo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-lg bg-white/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Control de Calidad Final Motorysa Pereira
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Por favor seleccione el estado de cada componente del vehículo
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Responsible and Plate Fields */}
              <div ref={responsibleRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-blue-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="responsible" className="text-sm font-medium text-gray-700">
                    Responsable <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="responsible"
                    value={responsible}
                    onChange={(e) => {
                      setResponsible(e.target.value);
                      if (responsibleError) setResponsibleError(false);
                    }}
                    placeholder="Ingrese el nombre del responsable"
                    className={responsibleError ? "border-red-500" : ""}
                  />
                  {responsibleError && (
                    <p className="text-red-500 text-sm">El nombre del responsable es requerido</p>
                  )}
                </div>
                
                <div ref={plateRef} className="space-y-2">
                  <Label htmlFor="plate" className="text-sm font-medium text-gray-700">
                    Placa Vehiculo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="plate"
                    value={plateNumber}
                    onChange={handlePlateChange}
                    placeholder="Ingrese la placa del vehículo"
                    className={plateError ? "border-red-500" : ""}
                  />
                  {plateError && (
                    <p className="text-red-500 text-sm">La placa del vehículo es requerida</p>
                  )}
                </div>
                
                <div ref={dateRef} className="space-y-2">
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
                  Control Calidad OK (Marcar para autocompletar todas las respuestas)
                </Label>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {questions.map((question, index) => {
                  const isLiquidQuestion = question.includes("liquidos") || 
                                          question.includes("Calidad de") || 
                                          question.includes("Estado y daños") || 
                                          question.includes("aire acondicionado") || 
                                          question.includes("tablero de instrumentos");
                  
                  const options = isLiquidQuestion ? liquidOptions : answerOptions;
                  const selectedOption = getSelectedOption(question);
                  
                  return (
                    <div 
                      key={index} 
                      ref={(el: HTMLDivElement | null) => { questionRefs.current[index] = el; }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-bold text-gray-800">
                        {index + 1}. {question} <span className="text-red-500">*</span>
                      </label>
                      
                      {/* Answer Buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {options.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleSelectChange(question, option.value)}
                              disabled={qualityControlOK}
                              className={getButtonClass(
                                formData[question] || "", 
                                option.value, 
                                option.color
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {errors[question] && !qualityControlOK && (
                        <p className="text-red-500 text-sm">Este campo es requerido</p>
                      )}
                      
                      {/* Observations field - shown for specific answers */}
                      {((formData[question] === "no-cumple" || 
                         formData[question] === "atencion-pronto" || 
                         formData[question] === "cambio-inmediato") && 
                        !qualityControlOK) && (
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
                          />
                          {observationErrors[question] && (
                            <p className="text-red-500 text-sm mt-1">Las observaciones son requeridas para esta respuesta</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {submitError && (
                <div className="text-red-500 text-center py-2">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="text-green-600 text-center py-2">
                  ¡Datos enviados correctamente a Google Sheets!
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