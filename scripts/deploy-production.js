#!/usr/bin/env node

/**
 * Production Deployment Script
 * Automates the deployment process and ensures production readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionDeployer {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      success: '🎉'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addCheck(name, status, message) {
    this.checks.push({ name, status, message });
    if (status === 'error') {
      this.errors.push(message);
      this.log(`${name}: ${message}`, 'error');
    } else if (status === 'warning') {
      this.warnings.push(message);
      this.log(`${name}: ${message}`, 'warn');
    } else {
      this.log(`${name}: ${message}`, 'info');
    }
  }

  checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    const requiredEnvVars = [
      'REACT_APP_SQUARE_ACCESS_TOKEN',
      'REACT_APP_SQUARE_APPLICATION_ID',
      'REACT_APP_SQUARE_LOCATION_ID',
      'REACT_APP_SQUARE_ENVIRONMENT',
      'REACT_APP_BACKEND_URL'
    ];

    const envFile = path.join(process.cwd(), '.env.production');
    if (!fs.existsSync(envFile)) {
      this.addCheck('Environment File', 'error', '.env.production file not found');
      return;
    }

    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    requiredEnvVars.forEach(varName => {
      if (!envVars[varName]) {
        this.addCheck('Environment Variables', 'error', `Missing required variable: ${varName}`);
      } else {
        this.addCheck('Environment Variables', 'success', `${varName} is configured`);
      }
    });

    // Check Square environment
    if (envVars['REACT_APP_SQUARE_ENVIRONMENT'] !== 'production') {
      this.addCheck('Square Environment', 'warning', 'Square environment is not set to production');
    } else {
      this.addCheck('Square Environment', 'success', 'Square environment is set to production');
    }
  }

  checkCodeQuality() {
    this.log('Running code quality checks...');
    
    try {
      // Run ESLint
      execSync('npm run lint', { stdio: 'pipe' });
      this.addCheck('ESLint', 'success', 'No linting errors found');
    } catch (error) {
      this.addCheck('ESLint', 'error', 'Linting errors found. Run npm run lint to see details.');
    }

    try {
      // Run TypeScript check
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.addCheck('TypeScript', 'success', 'No TypeScript errors found');
    } catch (error) {
      this.addCheck('TypeScript', 'error', 'TypeScript errors found. Run npx tsc --noEmit to see details.');
    }
  }

  checkSecurityConfiguration() {
    this.log('Checking security configuration...');
    
    // Check for console.log statements in production code
    const srcDir = path.join(process.cwd(), 'src');
    const consoleLogFiles = [];
    
    const checkForConsoleLogs = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          checkForConsoleLogs(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('console.log') && !content.includes('process.env.NODE_ENV === \'development\'')) {
            consoleLogFiles.push(filePath.replace(process.cwd(), ''));
          }
        }
      });
    };
    
    checkForConsoleLogs(srcDir);
    
    if (consoleLogFiles.length > 0) {
      this.addCheck('Console Logs', 'warning', `Found console.log statements in: ${consoleLogFiles.join(', ')}`);
    } else {
      this.addCheck('Console Logs', 'success', 'No unguarded console.log statements found');
    }

    // Check security.js configuration
    const securityConfigPath = path.join(process.cwd(), 'server', 'config', 'security.js');
    if (fs.existsSync(securityConfigPath)) {
      this.addCheck('Security Config', 'success', 'Security configuration file exists');
    } else {
      this.addCheck('Security Config', 'error', 'Security configuration file not found');
    }
  }

  checkDependencies() {
    this.log('Checking dependencies...');
    
    try {
      // Run security audit
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      this.addCheck('Security Audit', 'success', 'No high-severity vulnerabilities found');
    } catch (error) {
      this.addCheck('Security Audit', 'warning', 'High-severity vulnerabilities found. Run npm audit for details.');
    }

    // Check for outdated dependencies
    try {
      const outdated = execSync('npm outdated --json', { stdio: 'pipe' }).toString();
      const outdatedPackages = JSON.parse(outdated || '{}');
      const criticalPackages = Object.keys(outdatedPackages).filter(pkg => 
        ['react', 'react-dom', 'express', 'helmet'].includes(pkg)
      );
      
      if (criticalPackages.length > 0) {
        this.addCheck('Dependencies', 'warning', `Critical packages need updates: ${criticalPackages.join(', ')}`);
      } else {
        this.addCheck('Dependencies', 'success', 'Critical dependencies are up to date');
      }
    } catch (error) {
      this.addCheck('Dependencies', 'success', 'All dependencies are up to date');
    }
  }

  buildProduction() {
    this.log('Building production bundle...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      this.addCheck('Production Build', 'success', 'Production build completed successfully');
      
      // Check bundle size
      const buildDir = path.join(process.cwd(), 'build', 'static', 'js');
      if (fs.existsSync(buildDir)) {
        const jsFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.js'));
        const totalSize = jsFiles.reduce((size, file) => {
          const filePath = path.join(buildDir, file);
          return size + fs.statSync(filePath).size;
        }, 0);
        
        const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
        if (totalSize > 2 * 1024 * 1024) { // 2MB
          this.addCheck('Bundle Size', 'warning', `Bundle size is ${sizeMB}MB (consider optimization)`);
        } else {
          this.addCheck('Bundle Size', 'success', `Bundle size is ${sizeMB}MB`);
        }
      }
    } catch (error) {
      this.addCheck('Production Build', 'error', 'Production build failed');
    }
  }

  generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'READY' : 'NOT_READY',
      summary: {
        totalChecks: this.checks.length,
        passed: this.checks.filter(c => c.status === 'success').length,
        warnings: this.warnings.length,
        errors: this.errors.length
      },
      checks: this.checks,
      errors: this.errors,
      warnings: this.warnings
    };

    const reportPath = path.join(process.cwd(), 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Deployment report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log('🚀 Starting production deployment checks...', 'info');
    
    this.checkEnvironmentVariables();
    this.checkCodeQuality();
    this.checkSecurityConfiguration();
    this.checkDependencies();
    this.buildProduction();
    
    const report = this.generateDeploymentReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT READINESS REPORT');
    console.log('='.repeat(60));
    console.log(`Status: ${report.status}`);
    console.log(`Total Checks: ${report.summary.totalChecks}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      report.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (report.status === 'READY') {
      this.log('🎉 Application is ready for production deployment!', 'success');
      process.exit(0);
    } else {
      this.log('❌ Application is NOT ready for production. Please fix the errors above.', 'error');
      process.exit(1);
    }
  }
}

// Run the deployment checker
if (require.main === module) {
  const deployer = new ProductionDeployer();
  deployer.run().catch(error => {
    console.error('Deployment check failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionDeployer;