/**
 * Componente Form Reutilizável - Mobile First
 */

import { useState, useEffect } from "react";

export default function Form({
  fields = [],
  onSubmit,
  submitText = "Enviar",
  submitIcon = "",
  loading = false,
  error = null,
  success = null,
}) {
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const initialData = fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: field.value || field.defaultValue || "",
    }), {});
    setFormData(initialData);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    fields.forEach((field) => {
      const val = formData[field.name];
      if (field.required && (!val || (typeof val === 'string' && !val.trim()))) {
        errors[field.name] = `${field.label} é obrigatório`;
      } else if (field.validation && val) {
        const validationError = field.validation(val);
        if (validationError) {
          errors[field.name] = validationError;
        }
      }
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      {fields.map((field) => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name} className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              placeholder={field.placeholder || ""}
              disabled={loading}
              rows={field.rows || 4}
              className={`form-textarea ${formErrors[field.name] ? "error" : ""}`}
            />
          ) : field.type === "select" ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              disabled={loading}
              className={`form-select ${formErrors[field.name] ? "error" : ""}`}
            >
              <option value="">Selecione uma opção</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              type={field.type || "text"}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              placeholder={field.placeholder || ""}
              disabled={loading}
              min={field.min}
              max={field.max}
              step={field.step}
              className={`form-input ${formErrors[field.name] ? "error" : ""}`}
            />
          )}

          {formErrors[field.name] && (
            <span className="form-error">{formErrors[field.name]}</span>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary btn-full"
        style={{ marginTop: 8 }}
      >
        {loading ? (
          <>
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
            A guardar...
          </>
        ) : (
          <>
            {submitIcon && <span>{submitIcon}</span>}
            {submitText}
          </>
        )}
      </button>
    </form>
  );
}
