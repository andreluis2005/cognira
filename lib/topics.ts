import { Topic } from "./types";

export const TOPICS: Topic[] = [
    // D1 — Cloud Concepts
    { id: "CLOUD_BENEFITS", label: "Benefícios da Nuvem", macroDomain: "D1_CLOUD_CONCEPTS", examWeight: "HIGH" },
    { id: "SHARED_RESPONSIBILITY", label: "Modelo de Responsabilidade Compartilhada", macroDomain: "D1_CLOUD_CONCEPTS", examWeight: "HIGH" },
    { id: "WELL_ARCHITECTED", label: "Well-Architected Framework", macroDomain: "D1_CLOUD_CONCEPTS", examWeight: "MEDIUM" },

    // D2 — Security & Compliance
    { id: "IAM", label: "IAM", macroDomain: "D2_SECURITY_COMPLIANCE", examWeight: "HIGH" },
    { id: "SECURITY_GROUPS", label: "Security Groups & NACLs", macroDomain: "D2_SECURITY_COMPLIANCE", examWeight: "MEDIUM" },
    { id: "MFA", label: "Autenticação Multifator (MFA)", macroDomain: "D2_SECURITY_COMPLIANCE", examWeight: "MEDIUM" },

    // D3 — Technology & Services
    { id: "EC2", label: "Amazon EC2", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "HIGH" },
    { id: "LAMBDA", label: "AWS Lambda", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "MEDIUM" },
    { id: "S3", label: "Amazon S3", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "HIGH" },
    { id: "EBS", label: "Amazon EBS", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "MEDIUM" },
    { id: "EFS", label: "Amazon EFS", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "LOW" },
    { id: "RDS", label: "Amazon RDS", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "MEDIUM" },
    { id: "DYNAMODB", label: "Amazon DynamoDB", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "MEDIUM" },
    { id: "VPC", label: "Amazon VPC", macroDomain: "D3_TECHNOLOGY_SERVICES", examWeight: "HIGH" },

    // D4 — Billing & Support
    { id: "PRICING_MODELS", label: "Modelos de Precificação", macroDomain: "D4_BILLING_SUPPORT", examWeight: "HIGH" },
    { id: "BILLING_TOOLS", label: "AWS Budgets & Cost Explorer", macroDomain: "D4_BILLING_SUPPORT", examWeight: "HIGH" },
    { id: "SUPPORT_PLANS", label: "Planos de Suporte AWS", macroDomain: "D4_BILLING_SUPPORT", examWeight: "MEDIUM" },
];
