
import { ScanResult } from '../types';

/**
 * Transforms internal scan results into a CycloneDX v1.4 compliant JSON structure.
 */
export const transformToCycloneDX = (scan: ScanResult) => {
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    serialNumber: `urn:uuid:${scan.id}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: "SBOM Manager Pro",
          name: "Deterministic Security Engine",
          version: "6.0.0"
        }
      ],
      component: {
        name: scan.projectName,
        type: "application",
        bomRef: "root-app"
      }
    },
    components: scan.dependencies.map(dep => ({
      name: dep.name,
      version: dep.version,
      type: dep.type === 'third-party' ? "library" : "application",
      publisher: dep.source,
      licenses: [
        {
          license: {
            name: dep.license
          }
        }
      ],
      purl: `pkg:npm/${dep.name}@${dep.version}`,
      externalReferences: dep.filePath ? [{ type: "other", url: dep.filePath }] : []
    }))
  };
};

/**
 * Transforms internal scan results into an SPDX v2.3 compliant JSON structure.
 */
export const transformToSPDX = (scan: ScanResult) => {
  return {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: scan.projectName,
    documentNamespace: `https://sbom.manager.pro/spdx/${scan.projectName.replace(/\s+/g, '-')}-${scan.id}`,
    creationInfo: {
      creators: ["Tool: SBOM Manager Pro v6.0"],
      created: new Date().toISOString()
    },
    packages: scan.dependencies.map((dep, index) => ({
      name: dep.name,
      SPDXID: `SPDXRef-Package-${index}`,
      versionInfo: dep.version,
      downloadLocation: "NOASSERTION",
      filesAnalyzed: false,
      licenseConcluded: dep.license,
      licenseDeclared: dep.license,
      copyrightText: "NOASSERTION",
      summary: dep.reason || "Analyzed internal dependency.",
      externalRefs: [
        {
          referenceCategory: "PACKAGE-MANAGER",
          referenceType: "purl",
          referenceLocator: `pkg:npm/${dep.name}@${dep.version}`
        }
      ]
    })),
    relationships: [
      {
        spdxElementId: "SPDXRef-DOCUMENT",
        relationshipType: "DESCRIBES",
        relatedSpdxElement: "SPDXRef-Package-0"
      }
    ]
  };
};

/**
 * Transforms internal scan results into an ALS (Authoritative License Summary) JSON structure.
 * This format is used primarily for compliance and legal auditing.
 */
export const transformToALS = (scan: ScanResult) => {
  return {
    reportType: "Authoritative License Summary (ALS)",
    schemaVersion: "1.0.0",
    auditId: scan.id,
    generatedAt: new Date().toISOString(),
    project: {
      name: scan.projectName,
      totalComponents: scan.dependencies.length,
      highRiskCount: scan.vulnerabilities.critical + scan.vulnerabilities.high
    },
    authoritativeLicenseInventory: scan.dependencies.map(dep => ({
      component: dep.name,
      version: dep.version,
      licenseIdentifier: dep.license,
      origin: dep.source,
      purl: `pkg:npm/${dep.name}@${dep.version}`,
      complianceStatus: (dep.risk === 'Stable' || dep.risk === 'Low') ? "APPROVED" : "REVIEW_REQUIRED",
      riskLevel: dep.risk,
      policyViolations: dep.reason || "None detected"
    }))
  };
};
