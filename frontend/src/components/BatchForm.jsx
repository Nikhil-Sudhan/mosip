import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import Button from './Button';
import InputField from './InputField';

const schema = z.object({
  // Product Batch Documents
  productType: z.string().min(1, 'Product type is required'),
  grade: z.string().optional(),
  variety: z.string().optional(),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  weight: z.coerce.number().positive().optional().or(z.literal('')),
  weightUnit: z.string().optional(),
  
  // Harvest/Farm Details
  farmAddress: z.string().optional(),
  farmerDetails: z.string().optional(),
  harvestDate: z.string().min(4, 'Harvest date is required'),
  organicStatus: z.enum(['ORGANIC', 'NON_ORGANIC']).optional(),
  
  // Packaging Details
  containerDetails: z.string().optional(),
  
  // Origin/Destination
  originCountry: z.string().min(1, 'Origin country is required'),
  destinationCountry: z.string().min(1, 'Destination country is required'),
  
  notes: z.string().optional(),
});

export default function BatchForm({ onSubmit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      productType: '',
      grade: '',
      variety: '',
      batchNumber: '',
      quantity: 1000,
      unit: 'kg',
      weight: '',
      weightUnit: 'kg',
      farmAddress: '',
      farmerDetails: '',
      harvestDate: '',
      organicStatus: 'NON_ORGANIC',
      containerDetails: '',
      originCountry: '',
      destinationCountry: '',
      notes: '',
    },
  });

  const [activeSection, setActiveSection] = useState('product');
  const [fileInputs, setFileInputs] = useState({
    productDocuments: [],
    packagingPhotos: [],
    labReports: [],
    certifications: [],
    complianceDocs: [],
  });

  const sections = [
    { id: 'product', label: 'Product Details' },
    { id: 'farm', label: 'Farm & Harvest' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'lab', label: 'Lab Reports', requiredFiles: ['labReports'] },
    { id: 'certifications', label: 'Certifications', requiredFiles: ['certifications'] },
    { id: 'compliance', label: 'Compliance' },
  ];

  const handleFileChange = (category, files) => {
    setFileInputs(prev => ({
      ...prev,
      [category]: Array.from(files),
    }));
  };

  const canProceedToNext = () => {
    const currentSection = sections.find(s => s.id === activeSection);
    
    // Check if current section has required files
    if (currentSection?.requiredFiles) {
      const hasRequiredFiles = currentSection.requiredFiles.some(category => {
        const files = fileInputs[category] || [];
        return files.length > 0;
      });
      
      if (!hasRequiredFiles) {
        return false;
      }
    }
    
    return true;
  };

  const getRequiredFilesMessage = () => {
    const currentSection = sections.find(s => s.id === activeSection);
    if (!currentSection?.requiredFiles) return '';
    
    const missing = [];
    if (currentSection.requiredFiles.includes('labReports') && (fileInputs.labReports || []).length === 0) {
      missing.push('Lab Reports');
    }
    if (currentSection.requiredFiles.includes('certifications') && (fileInputs.certifications || []).length === 0) {
      missing.push('Certifications');
    }
    
    if (missing.length > 0) {
      return `Please upload the following required files: ${missing.join(', ')}`;
    }
    
    return '';
  };

  const handleNextSection = () => {
    if (!canProceedToNext()) {
      const message = getRequiredFilesMessage();
      alert(message || 'Please upload required files before proceeding to the next section.');
      return;
    }
    
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };

  const isLastSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    return currentIndex === sections.length - 1;
  };

  const validateRequiredFiles = () => {
    const errors = [];
    
    // Check lab reports (required)
    if ((fileInputs.labReports || []).length === 0) {
      errors.push('Lab Reports: At least one lab test report is required');
    }
    
    // Check certifications (required)
    if ((fileInputs.certifications || []).length === 0) {
      errors.push('Certifications: At least one certification document is required');
    }
    
    return errors;
  };

  const submitForm = async (values) => {
    // Validate required files before submission
    const fileErrors = validateRequiredFiles();
    if (fileErrors.length > 0) {
      alert('Please upload all required files:\n\n' + fileErrors.join('\n'));
      return;
    }
    
    const formData = new FormData();
    
    // Add all form fields
    Object.entries(values).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    // Add categorized files with correct field names matching backend expectations
    Object.entries(fileInputs).forEach(([category, files]) => {
      files.forEach((file) => {
        formData.append(category, file);
      });
    });

    try {
      await onSubmit(formData);
      reset();
      setFileInputs({
        productDocuments: [],
        packagingPhotos: [],
        labReports: [],
        certifications: [],
        complianceDocs: [],
      });
      // Reset file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });
    } catch (error) {
      // Error is handled by the parent component
      console.error('Form submission error:', error);
    }
  };

  const renderFileInput = (category, label, description, required = false, inputKey = null) => {
    const key = inputKey || category;
    const files = fileInputs[category] || [];
    return (
      <div className="space-y-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-bold text-violet-700">
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {description && (
            <span className="text-xs text-slate-500">{description}</span>
          )}
          <input
            key={key}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            multiple
            onChange={(e) => handleFileChange(category, e.target.files)}
            className="rounded-xl border-2 border-violet-200 bg-white px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-violet-300 focus:border-violet-500 hover:border-violet-300"
          />
          {files.length > 0 && (
            <span className="text-xs text-violet-600 font-medium">
              {files.length} file(s) selected
            </span>
          )}
        </label>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {sections.map((section, index) => {
          const isActive = activeSection === section.id;
          const isCompleted = sections.findIndex(s => s.id === activeSection) > index;
          const hasRequiredFiles = section.requiredFiles 
            ? section.requiredFiles.some(cat => (fileInputs[cat] || []).length > 0)
            : true;
          
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                // Only allow navigation to completed sections or next section
                const currentIndex = sections.findIndex(s => s.id === activeSection);
                const targetIndex = sections.findIndex(s => s.id === section.id);
                
                if (targetIndex <= currentIndex + 1) {
                  setActiveSection(section.id);
                } else {
                  alert('Please complete sections in order.');
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md'
                  : isCompleted && hasRequiredFiles
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit(submitForm)}
        className="space-y-6"
        noValidate
      >
        {/* Product Details Section */}
        {activeSection === 'product' && (
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2">
            <h3 className="md:col-span-2 text-lg font-bold text-violet-700 mb-2">
              Product Batch Documents
            </h3>
            
            <InputField
              label="Product Type *"
              name="productType"
              register={register}
              errors={errors}
              placeholder="e.g., rice, wheat, spices, coffee"
            />
            
            <InputField
              label="Batch Number *"
              name="batchNumber"
              register={register}
              errors={errors}
            />
            
            <InputField
              label="Grade"
              name="grade"
              register={register}
              errors={errors}
              placeholder="e.g., Grade A, Premium"
            />
            
            <InputField
              label="Variety"
              name="variety"
              register={register}
              errors={errors}
              placeholder="e.g., Basmati, Arabica"
            />
            
            <InputField
              label="Quantity *"
              name="quantity"
              type="number"
              register={register}
              errors={errors}
            />
            
            <InputField
              label="Unit *"
              name="unit"
              register={register}
              errors={errors}
              placeholder="kg / ton / bags"
            />
            
            <InputField
              label="Weight"
              name="weight"
              type="number"
              register={register}
              errors={errors}
            />
            
            <InputField
              label="Weight Unit"
              name="weightUnit"
              register={register}
              errors={errors}
              placeholder="kg / lbs"
            />
            
            <InputField
              label="Origin Country *"
              name="originCountry"
              register={register}
              errors={errors}
            />
            
            <InputField
              label="Destination Country *"
              name="destinationCountry"
              register={register}
              errors={errors}
            />
            
            <div className="md:col-span-2">
              {renderFileInput(
                'productDocuments',
                'Product Description Document',
                'Upload product description document (PDF, PNG, JPG)'
              )}
            </div>
            
            <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
              <span className="font-medium">Notes</span>
              <textarea
                className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                {...register('notes')}
              />
            </label>
          </div>
        )}

        {/* Farm & Harvest Section */}
        {activeSection === 'farm' && (
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2">
            <h3 className="md:col-span-2 text-lg font-bold text-violet-700 mb-2">
              Harvest/Farm Details
            </h3>
            
            <InputField
              label="Harvest Date *"
              name="harvestDate"
              type="date"
              register={register}
              errors={errors}
            />
            
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-bold text-violet-700">Organic Status</span>
              <select
                className="rounded-xl border-2 border-violet-200 bg-white px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-violet-300 focus:border-violet-500 hover:border-violet-300"
                {...register('organicStatus')}
              >
                <option value="NON_ORGANIC">Non-Organic</option>
                <option value="ORGANIC">Organic</option>
              </select>
            </label>
            
            <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
              <span className="font-medium">Farm Address</span>
              <textarea
                className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Full address of the farm"
                {...register('farmAddress')}
              />
            </label>
            
            <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
              <span className="font-medium">Farmer Details</span>
              <textarea
                className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Farmer name, contact information, etc."
                {...register('farmerDetails')}
              />
            </label>
          </div>
        )}

        {/* Packaging Section */}
        {activeSection === 'packaging' && (
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-violet-700 mb-2">
              Packaging Details
            </h3>
            
            {renderFileInput(
              'packagingPhotos',
              'Packaging Photos',
              'Upload photos of packaging (PNG, JPG)'
            )}
            
            {renderFileInput(
              'packagingPhotos',
              'Batch Packaging Labels',
              'Upload batch packaging labels (PDF, PNG, JPG)',
              false,
              'packaging-labels'
            )}
            
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              <span className="font-medium">Container Details</span>
              <textarea
                className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Container number, seal numbers, shipping details, etc."
                {...register('containerDetails')}
              />
            </label>
          </div>
        )}

        {/* Lab Reports Section */}
        {activeSection === 'lab' && (
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-violet-700 mb-2">
              Quality / Laboratory Inputs
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Upload lab test reports BEFORE QA inspection to speed up the process
            </p>
            {(fileInputs.labReports || []).length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 font-medium">
                  At least one lab test report is required to proceed to the next section.
                </p>
              </div>
            )}
            
            {renderFileInput(
              'labReports',
              'Lab Test Reports *',
              'General laboratory test reports (PDF)',
              true,
              'lab-reports-general'
            )}
            
            {renderFileInput(
              'labReports',
              'Moisture Test Report *',
              'Moisture content test results (PDF)',
              true,
              'lab-reports-moisture'
            )}
            
            {renderFileInput(
              'labReports',
              'Pesticide Residue Report *',
              'Pesticide residue analysis (PDF)',
              true,
              'lab-reports-pesticide'
            )}
            
            {renderFileInput(
              'labReports',
              'Aflatoxin Report',
              'Aflatoxin test results (for nuts/spices) (PDF)',
              false,
              'lab-reports-aflatoxin'
            )}
            
            {renderFileInput(
              'labReports',
              'Microbiological Test Results',
              'Microbiological analysis reports (PDF)',
              false,
              'lab-reports-microbiological'
            )}
          </div>
        )}

        {/* Certifications Section */}
        {activeSection === 'certifications' && (
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-violet-700 mb-2">
              Previous Certifications
            </h3>
            {(fileInputs.certifications || []).length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 font-medium">
                  At least one certification document is required to proceed to the next section.
                </p>
              </div>
            )}
            
            {renderFileInput(
              'certifications',
              'Organic Certifications *',
              'USDA Organic, EU Organic, India Organic certificates (PDF)',
              true,
              'cert-organic'
            )}
            
            {renderFileInput(
              'certifications',
              'GAP (Good Agricultural Practices)',
              'GAP certification documents (PDF)',
              false,
              'cert-gap'
            )}
            
            {renderFileInput(
              'certifications',
              'GMP (Good Manufacturing Practices)',
              'GMP certification documents (PDF)',
              false,
              'cert-gmp'
            )}
          </div>
        )}

        {/* Compliance Section */}
        {activeSection === 'compliance' && (
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-violet-700 mb-2">
              Compliance Documents
            </h3>
            
            {renderFileInput(
              'complianceDocs',
              'ISO Documentation',
              'ISO certification documents (PDF)',
              false,
              'compliance-iso'
            )}
            
            {renderFileInput(
              'complianceDocs',
              'Food Safety Standards',
              'Food safety compliance documents (PDF)',
              false,
              'compliance-food-safety'
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3 pt-4 border-t border-slate-200">
          <div>
            {sections.findIndex(s => s.id === activeSection) > 0 && (
              <Button
                type="button"
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection);
                  if (currentIndex > 0) {
                    setActiveSection(sections[currentIndex - 1].id);
                  }
                }}
                className="bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                Previous Section
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {!isLastSection() && (
              <Button
                type="button"
                onClick={handleNextSection}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                Next Section
              </Button>
            )}
            {isLastSection() && (
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting…' : 'Submit Batch'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
