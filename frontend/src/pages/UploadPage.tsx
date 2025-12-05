import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, FileCheck, Banknote, Receipt, Building2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

type DocumentType = 'salary_slip' | 'bank_statement' | 'tax_certificate';

interface FileUpload {
  file: File;
  uploading: boolean;
  message: string;
}

export default function UploadPage() {
  const [salarySlips, setSalarySlips] = useState<FileUpload[]>([]);
  const [bankStatements, setBankStatements] = useState<FileUpload[]>([]);
  const [taxCertificates, setTaxCertificates] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState<DocumentType | null>(null);
  const [globalMessage, setGlobalMessage] = useState("");
  
  const token = localStorage.getItem("TOKEN");

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please <Link to="/login" className="font-medium text-primary hover:underline">login</Link> to upload documents.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  async function uploadFile(file: File, type: DocumentType, index: number) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", type);

    // Update uploading state
    updateFileState(type, index, { uploading: true, message: "uploading" });

    try {
      const res = await fetch("http://localhost:4000/api/docs/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.ok) {
        updateFileState(type, index, { 
          uploading: false, 
          message: `success:Uploaded successfully` 
        });
        setGlobalMessage(`success:${file.name} uploaded successfully`);
        setTimeout(() => setGlobalMessage(""), 5000);
      } else {
        updateFileState(type, index, { 
          uploading: false, 
          message: `error:${data.error || "Upload failed"}` 
        });
      }
    } catch (err) {
      updateFileState(type, index, { 
        uploading: false, 
        message: "error:Network error. Make sure backend is running." 
      });
    }
  }

  function updateFileState(type: DocumentType, index: number, updates: Partial<FileUpload>) {
    const updateArray = (arr: FileUpload[]) => 
      arr.map((item, i) => i === index ? { ...item, ...updates } : item);

    if (type === 'salary_slip') setSalarySlips(updateArray);
    else if (type === 'bank_statement') setBankStatements(updateArray);
    else if (type === 'tax_certificate') setTaxCertificates(updateArray);
  }

  function handleDrag(e: React.DragEvent, type: DocumentType) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(type);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  }

  function handleDrop(e: React.DragEvent, type: DocumentType) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      
      if (validTypes.includes(droppedFile.type)) {
        addFile(droppedFile, type);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) {
    if (e.target.files && e.target.files[0]) {
      addFile(e.target.files[0], type);
      e.target.value = ''; // Reset input
    }
  }

  function addFile(file: File, type: DocumentType) {
    const newFile: FileUpload = { file, uploading: false, message: "" };
    
    if (type === 'salary_slip') setSalarySlips([...salarySlips, newFile]);
    else if (type === 'bank_statement') setBankStatements([...bankStatements, newFile]);
    else if (type === 'tax_certificate') setTaxCertificates([...taxCertificates, newFile]);
  }

  function removeFile(type: DocumentType, index: number) {
    if (type === 'salary_slip') setSalarySlips(salarySlips.filter((_, i) => i !== index));
    else if (type === 'bank_statement') setBankStatements(bankStatements.filter((_, i) => i !== index));
    else if (type === 'tax_certificate') setTaxCertificates(taxCertificates.filter((_, i) => i !== index));
  }

  function renderUploadSection(
    title: string,
    description: string,
    icon: React.ReactNode,
    type: DocumentType,
    files: FileUpload[]
  ) {
    // Check if all files are successfully uploaded
    const allUploaded = files.length > 0 && files.every(f => f.message.startsWith('success:'));
    
    return (
      <Card className={`glass-panel transition-all ${
        allUploaded ? 'bg-green-50/50 dark:bg-green-950/20 border-green-500/30' : ''
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={(e) => handleDrag(e, type)}
            onDragLeave={(e) => handleDrag(e, type)}
            onDragOver={(e) => handleDrag(e, type)}
            onDrop={(e) => handleDrop(e, type)}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive === type
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={(e) => handleFileChange(e, type)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="pointer-events-none">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {dragActive === type ? "Drop your file here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, PNG, or JPG (max 10MB)
              </p>
            </div>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fileUpload, index) => {
                const messageType = fileUpload.message.split(':')[0];
                const messageText = fileUpload.message.split(':')[1] || fileUpload.message;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      messageType === 'success' 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-500' 
                        : 'bg-card border-border'
                    }`}>
                      <FileText className={`h-6 w-6 flex-shrink-0 ${
                        messageType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-primary'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          messageType === 'success' ? 'text-green-700 dark:text-green-300' : ''
                        }`}>{fileUpload.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(fileUpload.file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      
                      {!fileUpload.uploading && messageType !== 'success' && (
                        <Button
                          size="sm"
                          onClick={() => uploadFile(fileUpload.file, type, index)}
                          disabled={fileUpload.uploading}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      )}
                      
                      {messageType === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(type, index)}
                        disabled={fileUpload.uploading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Progress */}
                    {fileUpload.uploading && (
                      <Progress value={66} className="h-1" />
                    )}

                    {/* Message */}
                    {fileUpload.message && messageType !== 'uploading' && (
                      <Alert variant={messageType === 'error' ? 'destructive' : 'default'} className="py-2">
                        {messageType === 'success' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        <AlertDescription className="text-xs">{messageText}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-semibold">Pakistan Tax Assist</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Tax Documents</h1>
          <p className="text-muted-foreground">
            Upload your salary slips, bank statements, and SMS tax certificates
          </p>
        </div>

        <div className="space-y-6">
          {/* Salary Slips Section */}
          {renderUploadSection(
            "Salary Slips",
            "Upload your monthly salary slips for the tax year",
            <Receipt className="h-5 w-5 text-primary" />,
            "salary_slip",
            salarySlips
          )}

          {/* Bank Statements Section */}
          {renderUploadSection(
            "Bank Statements",
            "Upload your bank statements showing income deposits",
            <Building2 className="h-5 w-5 text-primary" />,
            "bank_statement",
            bankStatements
          )}

          {/* Tax Certificates Section */}
          {renderUploadSection(
            "SMS Tax Certificates",
            "Upload your tax certificates received via SMS or email",
            <FileCheck className="h-5 w-5 text-primary" />,
            "tax_certificate",
            taxCertificates
          )}
        </div>

        {/* Global Success Message */}
        {globalMessage && globalMessage.startsWith('success:') && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/50 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{globalMessage.split(':')[1]}</AlertDescription>
          </Alert>
        )}

        {/* Info Card */}
        <Card className="glass-panel mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-primary" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>All documents must be in PDF, PNG, or JPG format (max 10MB each)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Ensure documents are clear and readable for accurate processing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>You can upload multiple files in each category</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
