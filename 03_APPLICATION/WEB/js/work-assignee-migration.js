// Legacy migration intentionally disabled.
// Work data normalization is handled by the governed Work module and must not
// run automatically on every page load. Automatic bulk writes caused the Work
// page to become unresponsive and coupled Admin rendering to data migration.
export {};
