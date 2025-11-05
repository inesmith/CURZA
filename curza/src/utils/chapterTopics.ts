// curza/src/utils/chapterTopics.ts
import { listOptionsAI } from "../../firebase";

export type TopicSection = {
  title: string;
  keyConcepts?: string[];
  formulas?: string[];
  exampleSteps?: string[];
  tips?: string[];
};

type GradeChapters = Record<string, string[]>;
type LocalCanon = Record<string, { chapters: GradeChapters }>;

// -------- LOCAL CAPS TOPICS (deterministic order) --------
const CAPS_LOCAL: LocalCanon = {
  "12": {
    chapters: {
      "1": ["Domain and Range", "Inverse Functions", "Exponential Functions", "Logarithmic Functions"],
      "2": ["Trigonometric Identities", "General Solutions", "Trigonometric Equations", "Trigonometric Graphs", "Applications of Trigonometry"],
      "3": ["Arithmetic Sequences", "Geometric Sequences", "Sigma Notation"],
      "4": ["First Principles", "Rules of Differentiation", "Tangents and Normals", "Optimization", "Rates of Change"],
      "5": ["Anti-derivatives", "Definite Integrals", "Area Under a Curve", "Area Between Curves"],
      "6": ["Distance & Midpoint", "Gradient & Intercepts", "Equation of a Line"],
      "7": ["Counting Principles", "Venn Diagrams", "Conditional Probability", "Independence & Mutual Exclusivity"],
      "8": ["Simple & Compound Interest", "Annuities", "Loan Repayments", "Depreciation", "Future & Present Value"],
    },
  },
};

// -------- OPTIONAL LOCAL KEY CONCEPTS --------
const LOCAL_CONCEPTS: Record<string, Record<string, Record<string, string[]>>> = {
  "12": {
    "1": {
      "Domain and Range": [
        "Domain: all permissible x-values",
        "Range: resulting y-values from the domain",
        "Restrictions: denominators ≠ 0, even roots ≥ 0",
        "Interval notation for domain/range",
        "Mapping x → f(x) consistency",
        "Piecewise domains and unions",
      ],
      "Inverse Functions": [
        "Swap x and y then solve for y",
        "Horizontal line test for invertibility",
        "Domain ↔ Range swap for inverse",
        "Reflection in y = x",
        "One-to-one requirement",
        "Notation: f⁻¹(x) not 1/f(x)",
      ],
      "Exponential Functions": [
        "Form: y = a·b^x, b>0, b≠1",
        "Horizontal asymptote y = 0 (basic form)",
        "Growth (b>1) vs decay (0<b<1)",
        "Transformations: a, vertical/horizontal shifts",
        "Log as inverse of exponentials",
        "Compound growth context problems",
      ],
      "Logarithmic Functions": [
        "Definition: log_b(a) = c ⇔ b^c = a",
        "Laws: product, quotient, power",
        "Domain: input > 0",
        "Change-of-base rule",
        "Inverse of y = b^x",
        "Common (log) and natural (ln) logs",
      ],
    },
    "2": {
      "Trigonometric Identities": [
        "Pythagorean: sin²θ + cos²θ = 1",
        "Quotient: tanθ = sinθ / cosθ",
        "Reciprocal identities",
        "Compound-angle basics (if covered)",
        "Reduction with CAST rule",
        "Use identities to simplify",
      ],
      "General Solutions": [
        "Periodicity of sin, cos, tan",
        "Reference angle method",
        "CAST rule (signs by quadrant)",
        "Add k·360° (or 2πk) for sin/cos",
        "+ k·180° (or πk) for tan",
        "Domain stated in degrees/radians",
      ],
      "Trigonometric Equations": [
        "Isolate trig function first",
        "Check for extraneous solutions",
        "Use identities to rewrite",
        "Consider domain restrictions",
        "Use inverse trig for principal value",
        "Add general solution terms",
      ],
      "Trigonometric Graphs": [
        "Amplitude, period, phase shift",
        "sin & cos period = 360°; tan = 180°",
        "Vertical shifts (midline)",
        "Key points per cycle",
        "Asymptotes for tan",
        "Transformations mapping",
      ],
      "Applications of Trigonometry": [
        "Right-triangle ratios",
        "Non-right triangles (if covered)",
        "Bearings and angles of elevation",
        "Wave models",
        "Harmonic motion basics",
        "Rounding & units",
      ],
    },
    "3": {
      "Arithmetic Sequences": [
        "Constant difference d",
        "nth term: a_n = a_1 + (n−1)d",
        "Partial sums S_n formula",
        "Graph is linear (discrete)",
        "Identify a_1 and d from data",
        "Word problems setup",
      ],
      "Geometric Sequences": [
        "Constant ratio r",
        "nth term: a_n = a_1·r^(n−1)",
        "Sum S_n; |r|<1 infinite sum",
        "Exponential growth/decay link",
        "Common ratio from successive terms",
        "Applications: finance, populations",
      ],
      "Sigma Notation": [
        "Σ index, lower/upper bounds",
        "Arithmetic/geometric sum formulas",
        "Split sums across terms",
        "Evaluate closed forms",
        "Change of index if needed",
        "Check bounds carefully",
      ],
    },
    "4": {
      "First Principles": [
        "Derivative: limit of difference quotient",
        "f'(x) = lim_{h→0} [f(x+h)−f(x)]/h",
        "Average vs instantaneous rate",
        "Algebraic simplification before limit",
        "Basic polynomials by first principles",
        "Interpret slope of tangent",
      ],
      "Rules of Differentiation": [
        "Power rule d(x^n)=n·x^{n−1}",
        "Constant & constant-multiple rules",
        "Sum/difference rules",
        "Product & quotient rules",
        "Chain rule for composites",
        "Derivatives of exp/log if covered",
      ],
      "Tangents and Normals": [
        "Tangent slope m = f'(x₀)",
        "Tangent eq: y−y₀ = m(x−x₀)",
        "Normal slope = −1/m",
        "Find point (x₀,y₀) on curve",
        "Slope from derivative",
        "Units & interpretation",
      ],
      "Optimization": [
        "Define objective function",
        "Express in one variable",
        "Critical points from f'(x)=0",
        "Second derivative test",
        "Endpoints & constraints",
        "Units & reasonableness",
      ],
      "Rates of Change": [
        "Related rates (if in scope)",
        "Units per variable",
        "Differentiate w.r.t time",
        "Substitute known rates",
        "Solve for target rate",
        "Check sign & magnitude",
      ],
    },
    "5": {
      "Anti-derivatives": [
        "Reverse power rule",
        "Constant of integration +C",
        "Check by differentiating",
        "Indefinite integral notation",
        "Basic u-substitution (if covered)",
        "Families of functions",
      ],
      "Definite Integrals": [
        "Area under curve (signed)",
        "Fundamental Theorem of Calculus",
        "Evaluate with antiderivative",
        "Change limits carefully",
        "Additivity over intervals",
        "Units of area",
      ],
      "Area Under a Curve": [
        "Integral accumulates area",
        "Above vs below x-axis (sign)",
        "Partition into subintervals",
        "Exact vs approximate methods",
        "Geometric areas when possible",
        "Interpretation in context",
      ],
      "Area Between Curves": [
        "Top − bottom integrated",
        "Split where curves cross",
        "Switch order if needed",
        "Units of area",
        "Sketch to avoid sign errors",
        "Check intersections precisely",
      ],
    },
    "6": {
      "Distance & Midpoint": [
        "Distance formula from Pythagoras",
        "Midpoint formula averages coords",
        "Segment interpretation",
        "Units & scale",
        "Vectors vs points distinction",
        "Coordinate geometry basics",
      ],
      "Gradient & Intercepts": [
        "Gradient m = Δy/Δx",
        "y-intercept c at x=0",
        "x-intercept(s) where y=0",
        "Slope-intercept form y=mx+c",
        "Parallel vs perpendicular lines",
        "Graphing from m and c",
      ],
      "Equation of a Line": [
        "Point-slope form",
        "Slope-intercept form",
        "Two-point form",
        "Parallel/perpendicular conditions",
        "Convert forms",
        "Check with a point",
      ],
    },
    "7": {
      "Counting Principles": [
        "Addition vs multiplication rule",
        "Permutations (order matters)",
        "Combinations (order not)",
        "Factorials and 0!",
        "Avoid double counting",
        "Tree diagrams for structure",
      ],
      "Venn Diagrams": [
        "Sets, subsets, complements",
        "Union ∪ and intersection ∩",
        "Disjoint vs overlapping",
        "Inclusion–exclusion principle",
        "Region counts mapping",
        "Translate words → sets",
      ],
      "Conditional Probability": [
        "P(A|B) = P(A∩B)/P(B)",
        "Independent vs dependent",
        "Bayes’ rule basics",
        "Tree diagram with probabilities",
        "Total probability rule",
        "Check valid probability range",
      ],
      "Independence & Mutual Exclusivity": [
        "Independent: P(A∩B)=P(A)P(B)",
        "Mutually exclusive: P(A∩B)=0",
        "Not the same concept",
        "Use definitions to test",
        "Real-world examples",
        "Common confusions",
      ],
    },
    "8": {
      "Simple & Compound Interest": [
        "Simple I = P·i·n",
        "Compound A = P(1+i)^n",
        "Nominal vs effective rates",
        "Compounding periods",
        "Convert % to decimal",
        "Time and rate units align",
      ],
      "Annuities": [
        "Future value of series",
        "Present value of series",
        "Periodic deposits/payments",
        "Interest per period",
        "Ordinary vs annuity due",
        "Amortisation link",
      ],
      "Loan Repayments": [
        "Amortisation schedule",
        "Interest vs principal split",
        "Outstanding balance calc",
        "Fixed vs variable rates",
        "Early repayment effects",
        "Total cost of credit",
      ],
      "Depreciation": [
        "Straight-line model",
        "Diminishing-balance model",
        "Rate per period",
        "Book value over time",
        "Residual/salvage value",
        "Context interpretation",
      ],
      "Future & Present Value": [
        "Time value of money",
        "Discounting vs compounding",
        "Equivalence of cash flows",
        "Choosing correct formula",
        "Align periods and rates",
        "Rounding & currency",
      ],
    },
  },
};

/** Local FORMULAS enrichment (normalized topic → extras) */
const CAPS_LOCAL_ENRICH: Record<string, Record<string, Record<string, { formulas?: string[] }>>> = {
  "12": {
    "1": {
      "domain and range": {
        formulas: [
          "Domain: all x-values where f(x) is defined",
          "Range: all y-values produced by f(x)",
          "Restrictions: denominator ≠ 0; even roots: radicand ≥ 0; logs: argument > 0",
        ],
      },
      "inverse functions": {
        formulas: [
          "Inverse: f⁻¹(x) such that f(f⁻¹(x)) = x",
          "Find inverse: swap x and y, then solve for y",
          "(f⁻¹)′(a) = 1 / f′(f⁻¹(a))",
        ],
      },
      "exponential functions": {
        formulas: [
          "General: y = a·b^x (a ≠ 0, b > 0, b ≠ 1)",
          "Growth/decay: A = P(1 ± r)^t",
          "Laws: b^m·b^n = b^{m+n}, (b^m)^n = b^{mn}, b^{−n}=1/b^n",
        ],
      },
      "logarithmic functions": {
        formulas: [
          "Definition: log_b(a)=c ⇔ b^c=a",
          "Laws: log_b(MN)=log_b M+log_b N; log_b(M/N)=log_b M−log_b N",
          "Change of base: log_b a = (log_k a)/(log_k b)",
        ],
      },
    },
    "2": {
      "trigonometric identities": {
        formulas: [
          "sin²θ+cos²θ=1,  tanθ=sinθ/cosθ, 1+tan²θ=sec²θ",
          "sin(α±β)=sinα cosβ ± cosα sinβ",
          "cos(α±β)=cosα cosβ ∓ sinα sinβ",
        ],
      },
      "general solutions": {
        formulas: [
          "sinθ=k → θ=(−1)^n arcsin(k)+nπ",
          "cosθ=k → θ=±arccos(k)+2nπ",
          "tanθ=k → θ=arctan(k)+nπ",
        ],
      },
      "trigonometric equations": {
        formulas: [
          "Use identities/substitution; check restrictions",
          "Quadratic in sin/cos → let u = sinθ or cosθ",
        ],
      },
      "trigonometric graphs": {
        formulas: [
          "y=a·sin(bx+c)+d → amplitude=|a|, period=2π/|b|",
          "y=a·tan(bx+c)+d → period=π/|b|, vertical asymptotes",
        ],
      },
      "applications of trigonometry": {
        formulas: [
          "Sine rule: a/sinA=b/sinB=c/sinC",
          "Cosine rule: c²=a²+b²−2ab cosC",
          "Area: (1/2)ab sinC",
        ],
      },
    },
    "3": {
      "arithmetic sequences": { formulas: ["a_n=a₁+(n−1)d", "S_n=(n/2)[2a₁+(n−1)d]"] },
      "geometric sequences": { formulas: ["a_n=a₁ r^{n−1}", "S_n=a₁(1−r^n)/(1−r),  |r|≠1", "S_∞=a₁/(1−r), |r|<1"] },
      "sigma notation": { formulas: ["∑_{k=1}^{n} k=n(n+1)/2", "∑_{k=1}^{n} k²=n(n+1)(2n+1)/6"] },
    },
    "4": {
      "first principles": { formulas: ["f′(x)=lim_{h→0}[f(x+h)−f(x)]/h", "For x^n: f′(x)=n x^{n−1}"] },
      "rules of differentiation": { formulas: ["Product: (uv)′=u′v+uv′", "Quotient: (u/v)′=(u′v−uv′)/v²", "Chain: d/dx f(g)=f′(g)·g′"] },
      "tangents and normals": { formulas: ["Tangent slope: m=f′(a);  y−f(a)=f′(a)(x−a)", "Normal slope: −1/f′(a)"] },
      "optimization": { formulas: ["Critical points: f′=0 or undefined", "Second derivative test: f′′>0 min; <0 max"] },
      "rates of change": { formulas: ["Related rates: differentiate wrt t", "dy/dt=(dy/dx)(dx/dt)"] },
    },
    "5": {
      "anti-derivatives": { formulas: ["∫x^n dx=x^{n+1}/(n+1)+C (n≠−1)", "∫1/x dx=ln|x|+C"] },
      "definite integrals": { formulas: ["∫_a^b f(x) dx = F(b)−F(a)", "FTC: If F′=f then ∫_a^b f=F(b)−F(a)"] },
      "area under a curve": { formulas: ["A=∫_a^b f(x) dx (f≥0 on [a,b])", "Split at roots if f changes sign"] },
      "area between curves": { formulas: ["A=∫_a^b [f(x)−g(x)] dx where f≥g"] },
    },
    "6": {
      "distance & midpoint": { formulas: ["d=√[(x₂−x₁)²+(y₂−y₁)²]", "M=((x₁+x₂)/2,(y₁+y₂)/2)"] },
      "gradient & intercepts": { formulas: ["m=(y₂−y₁)/(x₂−x₁)", "Parallel: m₁=m₂; Perpendicular: m₁·m₂=−1"] },
      "equation of a line": { formulas: ["Point-slope: y−y₁=m(x−x₁)", "Slope-intercept: y=mx+c"] },
    },
    "7": {
      "counting principles": { formulas: ["nPr=n!/(n−r)!", "nCr=n!/[r!(n−r)!]"] },
      "venn diagrams": { formulas: ["n(A∪B)=n(A)+n(B)−n(A∩B)", "n(Aᶜ)=n(U)−n(A)"] },
      "conditional probability": { formulas: ["P(A|B)=P(A∩B)/P(B)", "Bayes variations"] },
      "independence & mutual exclusivity": { formulas: ["Independent: P(A∩B)=P(A)P(B)", "Mutually exclusive: P(A∩B)=0"] },
    },
    "8": {
      "simple & compound interest": { formulas: ["Simple: A=P(1+in);  I=Pin", "Compound: A=P(1+i)^n"] },
      "annuities": { formulas: ["FV: F=R[(1+i)^n−1]/i", "PV: P=R[1−(1+i)^{−n}]/i"] },
      "loan repayments": { formulas: ["Amortisation: interest=i×balance; principal=payment−interest"] },
      "depreciation": { formulas: ["Straight-line: V=C−nd", "Reducing balance: V=C(1−i)^n"] },
      "future & present value": { formulas: ["FV: F=P(1+i)^n", "PV: P=F(1+i)^{−n}"] },
    },
  },
};

/** NEW: Local EXAMPLE STEPS enrichment */
const CAPS_LOCAL_EXAMPLES: Record<string, Record<string, Record<string, string[]>>> = {
  "12": {
    "1": {
      "domain and range": [
        "Given f(x)=√(x−3), set x−3 ≥ 0 → x ≥ 3",
        "Domain: [3, ∞)",
        "Range: y ≥ 0 because square root outputs ≥ 0",
      ],
      "inverse functions": [
        "Start: y = (2x−3)/5",
        "Swap: x = (2y−3)/5 → 5x = 2y−3 → 2y = 5x+3 → y = (5x+3)/2",
        "Answer: f⁻¹(x) = (5x+3)/2",
      ],
      "exponential functions": [
        "Solve 2000 = 1000(1.08)^t",
        "Divide: 2 = (1.08)^t → t = log(2)/log(1.08)",
        "Compute t ≈ 9 years",
      ],
      "logarithmic functions": [
        "Solve log_3(x) = 4 → 3^4 = x",
        "Compute x = 81",
        "State domain restrictions",
      ],
    },
    "2": {
      "trigonometric identities": [
        "Simplify (1−cos²θ)/sinθ ⇒ sinθ",
        "Use sin²θ = 1−cos²θ",
        "Cancel carefully; check domain",
      ],
      "general solutions": [
        "Solve sinθ = 1/2 on [0°,360°): 30°,150°",
        "General: θ = 30° + 360°k or 150° + 360°k",
        "Convert to radians if needed",
      ],
      "trigonometric equations": [
        "Solve 2sinθ−1=0 ⇒ sinθ=1/2",
        "θ=30°,150°; add general terms",
        "Check restrictions",
      ],
      "trigonometric graphs": [
        "Graph y=2sin(x−30°)+1",
        "Amplitude=2, period=360°, phase shift=+30°, midline y=1",
        "Plot key points",
      ],
      "applications of trigonometry": [
        "Given a=7, b=10, C=40°",
        "Use cosine rule for c",
        "Area=½ab sinC",
      ],
    },
    "3": {
      "arithmetic sequences": [
        "a₁=4, d=3 ⇒ a₁₀=4+(10−1)·3=31",
        "S₁₀=(10/2)[2·4+(10−1)·3]=175",
        "Check with quick list if unsure",
      ],
      "geometric sequences": [
        "a₁=5, r=2 ⇒ a₈=5·2⁷=640",
        "S₈=5(1−2⁸)/(1−2)=1275",
        "Interpret growth",
      ],
      "sigma notation": [
        "∑_{k=1}^{5} (2k+1)=35",
        "Verify with AP sum formula",
        "Be careful with bounds",
      ],
    },
    "4": {
      "first principles": [
        "f(x)=x² ⇒ f′(x)=lim_{h→0}[(x+h)²−x²]/h",
        "Simplify to 2x+h → 2x",
        "Result: 2x",
      ],
      "rules of differentiation": [
        "Differentiate y=3x³−5x ⇒ y′=9x²−5",
        "Check with power rule",
        "Units/shape check",
      ],
      "tangents and normals": [
        "At x=3 for y=x²: m=2x=6",
        "Tangent: y−9=6(x−3)",
        "Normal slope=−1/6",
      ],
      "optimization": [
        "Perimeter 40 ⇒ y=20−x",
        "A=x(20−x), A′=20−2x=0 ⇒ x=10",
        "Square maximises area",
      ],
      "rates of change": [
        "x(t)=t³ ⇒ dx/dt=3t²",
        "At t=2 ⇒ 12",
        "Interpretation",
      ],
    },
    "5": {
      "anti-derivatives": [
        "∫(6x²−4) dx = 2x³ − 4x + C",
        "Differentiate to verify",
        "Note +C",
      ],
      "definite integrals": [
        "∫₀² (3x) dx = 6",
        "Check via area",
        "Units of area",
      ],
      "area under a curve": [
        "A under y=x on [0,3] ⇒ 9/2",
        "Sketch to confirm",
        "Signed area note",
      ],
      "area between curves": [
        "Between y=4 and y=x² on [−2,2]",
        "A=∫(4−x²) = 32/3",
        "Use intersections",
      ],
    },
    "6": {
      "distance & midpoint": [
        "A(−1,2), B(3,−2)",
        "d=√32, M=(1,0)",
        "Units",
      ],
      "gradient & intercepts": [
        "Through (0,3),(2,7): m=2",
        "y=2x+3, x-int −3/2",
        "Parallel ⇒ equal m",
      ],
      "equation of a line": [
        "Point (4,−1), m=−3",
        "y+1=−3(x−4) ⇒ y=−3x+11",
        "Verify with point",
      ],
    },
    "7": {
      "counting principles": [
        "5P3 = 60, 5C3 = 10",
        "Choose rule wisely",
        "Avoid double count",
      ],
      "venn diagrams": [
        "20 A, 15 B, 8 both, N=30",
        "A∪B=27, neither=3",
        "Sketch regions",
      ],
      "conditional probability": [
        "P(A)=0.4, P(B)=0.5, P(A∩B)=0.2",
        "P(A|B)=0.4; independent check",
        "Compare P(A) vs P(A|B)",
      ],
      "independence & mutual exclusivity": [
        "Mutually exclusive ⇒ ∩=0",
        "Independent ⇒ ∩=product",
        "Test with numbers",
      ],
    },
    "8": {
      "simple & compound interest": [
        "P=1000, i=10%, n=3",
        "Simple A=1300; Compound A≈1331",
        "Compare results",
      ],
      "annuities": [
        "R=1000, i=1%/m, n=12",
        "FV≈12682.50",
        "Monthly vs yearly",
      ],
      "loan repayments": [
        "Interest=iB, principal=R−iB",
        "Update balance",
        "Schedule logic",
      ],
      "depreciation": [
        "C=200k, 20% RB, n=3",
        "V≈102,400",
        "Straight-line variant",
      ],
      "future & present value": [
        "F=5000(1.08)^5≈7347.27",
        "PV of 10k in 3 yrs ≈7938",
        "Interpret time value",
      ],
    },
  },
};

/** NEW: Local TIPS enrichment */
const CAPS_LOCAL_TIPS: Record<string, Record<string, Record<string, string[]>>> = {
  "12": {
    "1": {
      "domain and range": [
        "Always state domain before range.",
        "Watch for division by 0 and even roots.",
        "Use interval notation consistently.",
      ],
      "inverse functions": [
        "Use the horizontal line test for one-to-one.",
        "Write f⁻¹(x), not 1/f(x).",
        "Swap domain and range between f and f⁻¹.",
      ],
      "exponential functions": [
        "b>1 → growth; 0<b<1 → decay.",
        "Sketch asymptote y=0 for basics.",
        "Convert percentages to decimals.",
      ],
      "logarithmic functions": [
        "Input must be positive.",
        "Use change-of-base for calculator eval.",
        "Remember logs invert exponents.",
      ],
    },
    "2": {
      "trigonometric identities": [
        "Start with Pythagorean identities.",
        "Use CAST to determine signs.",
        "Simplify before substituting values.",
      ],
      "general solutions": [
        "Add period terms (360°k or 180°k).",
        "Quote the requested domain.",
        "Prefer reference angles for speed.",
      ],
      "trigonometric equations": [
        "Isolate the trig function first.",
        "Check for extraneous roots.",
        "Use identities to rewrite to basic forms.",
      ],
      "trigonometric graphs": [
        "Identify amplitude, period, phase shift, vertical shift.",
        "Plot one full cycle with key points.",
        "Mark asymptotes for tan.",
      ],
      "applications of trigonometry": [
        "Label diagrams with bearings/units.",
        "Choose sine/cosine rule appropriately.",
        "Round at the end, not mid-steps.",
      ],
    },
    "3": {
      "arithmetic sequences": [
        "Find d from consecutive terms.",
        "Use S_n for sum questions.",
        "Check answers with quick term list.",
      ],
      "geometric sequences": [
        "Confirm constant ratio r.",
        "Remember S_∞ only if |r|<1.",
        "Interpret r’s sign for behaviour.",
      ],
      "sigma notation": [
        "Write bounds clearly.",
        "Split sums across + and constants.",
        "Use known ∑k and ∑k² identities.",
      ],
    },
    "4": {
      "first principles": [
        "Algebra first, limit last.",
        "Factor and cancel before letting h→0.",
        "Know derivative meaning as slope.",
      ],
      "rules of differentiation": [
        "Apply product/quotient carefully.",
        "Chain rule: outer′×inner′.",
        "Keep like terms tidy.",
      ],
      "tangents and normals": [
        "Get point and slope before equation.",
        "Normal slope is −1/m_tangent.",
        "Check the point lies on the line.",
      ],
      "optimization": [
        "Define variables with units.",
        "Reduce to one variable before diff.",
        "Test endpoints and critical points.",
      ],
      "rates of change": [
        "Relate variables first.",
        "Differentiate w.r.t time.",
        "Keep units consistent.",
      ],
    },
    "5": {
      "anti-derivatives": [
        "Add +C for indefinite integrals.",
        "Differentiate result to verify.",
        "Use power rule in reverse.",
      ],
      "definite integrals": [
        "Plug upper then lower limits.",
        "Split intervals at sign changes.",
        "Mind area sign (above/below axis).",
      ],
      "area under a curve": [
        "Sketch to avoid sign mistakes.",
        "Prefer exact values where possible.",
        "State units (square units).",
      ],
      "area between curves": [
        "Integrate top − bottom.",
        "Find intersection points accurately.",
        "Split integral if ordering swaps.",
      ],
    },
    "6": {
      "distance & midpoint": [
        "Draw a quick diagram.",
        "Keep surds exact until the end.",
        "Check midpoint by averaging coords.",
      ],
      "gradient & intercepts": [
        "Rise over run for slope.",
        "Find intercepts by setting x or y to 0.",
        "Parallel: equal slopes; perpendicular: product −1.",
      ],
      "equation of a line": [
        "Point-slope form is quickest.",
        "Convert to y=mx+c if asked.",
        "Verify with a known point.",
      ],
    },
    "7": {
      "counting principles": [
        "Decide if order matters first.",
        "Use tree diagrams for clarity.",
        "Avoid double counting in unions.",
      ],
      "venn diagrams": [
        "Map each statement to a region.",
        "Use inclusion–exclusion.",
        "Check totals against universe.",
      ],
      "conditional probability": [
        "Start from definition P(A|B)=P(A∩B)/P(B).",
        "Use tables or trees.",
        "Test independence with P(A)P(B)=P(A∩B).",
      ],
      "independence & mutual exclusivity": [
        "Exclusive ≠ independent.",
        "State which property you’re testing.",
        "Give a numeric counterexample if unsure.",
      ],
    },
    "8": {
      "simple & compound interest": [
        "Match i and n units (years, months).",
        "Convert % to decimal.",
        "State compounding frequency.",
      ],
      "annuities": [
        "Differentiate FV vs PV questions.",
        "Use i per period, not per annum (unless single period).",
        "Ordinary vs due: shift one period.",
      ],
      "loan repayments": [
        "Interest first, principal second.",
        "Track outstanding balance each period.",
        "Total cost includes interest.",
      ],
      "depreciation": [
        "Use correct model (straight-line vs reducing).",
        "Quote residual value if applicable.",
        "Keep period units consistent.",
      ],
      "future & present value": [
        "PV discounts back; FV compounds forward.",
        "Show formulas before numbers.",
        "Round currency at the end.",
      ],
    },
  },
};

// ---------------- utils ----------------
const norm = (s: any) => String(s ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
const sameish = (a?: string, b?: string) => norm(a) === norm(b);

function isCAPS(curr: any) { return String(curr ?? "").toUpperCase().includes("CAPS"); }
function isMaths(subj: any) {
  const s = String(subj ?? "").toUpperCase().trim();
  return s === "MATHEMATICS" || s === "MATHS" || s === "MATHEMATICS (CORE)" || s.includes("MATHEMATICS");
}
function cleanGrade(g: any) { const n = String(g ?? "").replace(/\D+/g, ""); return n || "12"; }
function cleanChapter(ch: any) { return String(ch ?? "").replace(/\D+/g, ""); }

function stripPlaceholders(arr: string[]): string[] {
  const bad = new Set(["intro","introduction","overview","general overview","chapter intro","chapter introduction","intro concepts"]);
  return arr.map(s => String(s ?? "").trim()).filter(s => s && !bad.has(s.toLowerCase()));
}

function stripChapterPrefix(s: string) {
  return String(s).replace(/^chapter\s*\d+\s*[:\-–]\s*/i, "").trim();
}

function dedupe(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of arr) {
    const k = norm(t);
    if (!seen.has(k)) { seen.add(k); out.push(t); }
  }
  return out;
}

function neutralTemplate(): TopicSection[] {
  return [
    { title: "Overview & Key Ideas" },
    { title: "Core Definitions" },
    { title: "Formulas & Rules" },
    { title: "Worked Example" },
    { title: "Common Mistakes & Tips" },
  ];
}

const stripLead = (s: string) => String(s ?? "").replace(/^[•\-\d\.\)\s]+/, "").trim();
function toList(raw: any, keys: string[]): string[] {
  const arr: any[] =
    keys.reduce<any[]>((acc, k) => (Array.isArray(raw?.data?.[k]) ? raw.data[k] : acc), raw?.data?.items ?? raw?.data ?? raw);
  const list = Array.isArray(arr) ? arr : [];
  return dedupe(
    list
      .map((x) => (typeof x === "string" ? x : (x?.title ?? x?.name ?? x?.text ?? x?.step ?? "")))
      .map((s) => stripLead(String(s)))
      .filter(Boolean)
      .filter((s) => s.length <= 160)
  ).slice(0, 8);
}

/** Merge local formulas, examples, and tips without overwriting existing non-empty fields */
function enrichTopicsWithLocal(
  grade: string,
  chapter: string,
  topics: TopicSection[]
): TopicSection[] {
  const byFormulas = CAPS_LOCAL_ENRICH[grade]?.[chapter];
  const byExamples = CAPS_LOCAL_EXAMPLES[grade]?.[chapter];
  const byTips = CAPS_LOCAL_TIPS[grade]?.[chapter];

  return topics.map((t) => {
    const key = norm(t.title);
    const extraF = byFormulas?.[key]?.formulas;
    const extraE = byExamples?.[key];
    const extraT = byTips?.[key];

    return {
      ...t,
      formulas: (t.formulas && t.formulas.length) ? t.formulas : (extraF ?? t.formulas),
      exampleSteps: (t.exampleSteps && t.exampleSteps.length) ? t.exampleSteps : (extraE ?? t.exampleSteps),
      tips: (t.tips && t.tips.length) ? t.tips : (extraT ?? t.tips),
    };
  });
}

// --------- fetchers (LOCAL → AI fallback) ----------
async function getKeyConceptsForTopic(ctx: {
  curriculum?: string;
  grade?: string | number;
  subject?: string;
  chapter?: string | number;
  chapterName?: string;
  topic: string;
}): Promise<string[]> {
  const g = cleanGrade(ctx.grade);
  const ch = cleanChapter(ctx.chapter);
  const t = ctx.topic;

  const local = LOCAL_CONCEPTS[g]?.[ch]?.[t];
  if (local?.length) return local;

  try {
    const res = await listOptionsAI({
      type: "topics",
      mode: "key_concepts",
      curriculum: ctx.curriculum || "CAPS",
      grade: g,
      subject: ctx.subject || "Mathematics",
      chapter: ch,
      chapterName: ctx.chapterName || "",
      topic: t,
      max: 6,
    } as any);
    return toList(res, ["concepts", "items"]);
  } catch (e) {
    console.log("[getKeyConceptsForTopic] AI failed:", e);
    return [];
  }
}

async function getExampleStepsForTopic(ctx: {
  curriculum?: string;
  grade?: string | number;
  subject?: string;
  chapter?: string | number;
  chapterName?: string;
  topic: string;
}): Promise<string[]> {
  const g = cleanGrade(ctx.grade);
  const ch = cleanChapter(ctx.chapter);
  const t = ctx.topic;

  const local = CAPS_LOCAL_EXAMPLES[g]?.[ch]?.[norm(t)];
  if (local?.length) return local;

  try {
    const res = await listOptionsAI({
      type: "topics",
      mode: "example_steps",
      curriculum: ctx.curriculum || "CAPS",
      grade: g,
      subject: ctx.subject || "Mathematics",
      chapter: ch,
      chapterName: ctx.chapterName || "",
      topic: t,
      max: 8,
    } as any);
    return toList(res, ["examples", "steps", "items"]);
  } catch (e) {
    console.log("[getExampleStepsForTopic] AI failed:", e);
    return [];
  }
}

/** NEW: tips fetcher (LOCAL → AI fallback) */
async function getTipsForTopic(ctx: {
  curriculum?: string;
  grade?: string | number;
  subject?: string;
  chapter?: string | number;
  chapterName?: string;
  topic: string;
}): Promise<string[]> {
  const g = cleanGrade(ctx.grade);
  const ch = cleanChapter(ctx.chapter);
  const t = ctx.topic;

  const local = CAPS_LOCAL_TIPS[g]?.[ch]?.[norm(t)];
  if (local?.length) return local;

  try {
    const res = await listOptionsAI({
      type: "topics",
      mode: "tips",
      curriculum: ctx.curriculum || "CAPS",
      grade: g,
      subject: ctx.subject || "Mathematics",
      chapter: ch,
      chapterName: ctx.chapterName || "",
      topic: t,
      max: 8,
    } as any);
    return toList(res, ["tips", "items"]);
  } catch (e) {
    console.log("[getTipsForTopic] AI failed:", e);
    return [];
  }
}

// --------------- main ------------------
export async function getTopicsForChapter(params: {
  curriculum?: string;
  grade?: string | number;
  subject?: string;
  chapter?: string | number;
  chapterName?: string;
}): Promise<TopicSection[]> {
  const { curriculum, grade, subject, chapter, chapterName } = params || {};
  const g = cleanGrade(grade);
  const ch = cleanChapter(chapter);
  const chapNameClean = stripChapterPrefix(String(chapterName ?? ""));

  // 1) LOCAL CANON → hydrate (concepts, examples, tips) → enrich (formulas/examples/tips)
  if (isCAPS(curriculum) && isMaths(subject) && CAPS_LOCAL[g]?.chapters[ch]) {
    const cleaned = stripPlaceholders(CAPS_LOCAL[g].chapters[ch]);
    const titles = dedupe(
      cleaned.map(stripChapterPrefix).filter(t => t && !sameish(t, chapNameClean))
    );

    if (titles.length) {
      console.log("[getTopicsForChapter] LOCAL topics used:", titles);

      const hydrated = await Promise.all(
        titles.map(async (title) => {
          const [keyConcepts, exampleSteps, tips] = await Promise.all([
            getKeyConceptsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: title }),
            getExampleStepsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: title }),
            getTipsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: title }),
          ]);
          return { title, keyConcepts, exampleSteps, tips } as TopicSection;
        })
      );

      return enrichTopicsWithLocal(g, ch, hydrated);
    }
  }

  // 2) AI fallback → hydrate (concepts, examples, tips) → enrich with locals
  try {
    const res: any = await listOptionsAI({
      type: "topics",
      curriculum: curriculum || "CAPS",
      grade: g,
      subject: subject || "Mathematics",
      chapter: ch,
      chapterName: chapterName || "",
    });

    const items: any[] = res?.data?.items || res?.data?.topics || [];
    if (Array.isArray(items) && items.length) {
      const raw = items.map(x =>
        typeof x === "string" ? x : (x?.title ?? x?.name ?? x?.topic ?? x?.heading ?? "")
      );

      const titles = dedupe(
        stripPlaceholders(raw)
          .map(stripChapterPrefix)
          .map(t => t.trim())
          .filter(Boolean)
          .filter(t => !sameish(t, chapNameClean))
      );

      if (titles.length) {
        console.log("[getTopicsForChapter] AI topics used:", titles);

        const hydrated = await Promise.all(
          titles.map(async (title) => {
            const [keyConcepts, exampleSteps, tips] = await Promise.all([
              getKeyConceptsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: title }),
              getExampleStepsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: title }),
              getTipsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: title }),
            ]);
            return { title, keyConcepts, exampleSteps, tips } as TopicSection;
          })
        );

        return enrichTopicsWithLocal(g, ch, hydrated);
      }
    }
  } catch (e) {
    console.log("[getTopicsForChapter] listOptionsAI failed:", e);
  }

  // 3) Neutral fallback → hydrate (concepts, examples, tips) → enrich with locals
  console.log("[getTopicsForChapter] No topics found; using neutral template");
  const neutral = neutralTemplate();

  const hydrated = await Promise.all(
    neutral.map(async (t) => {
      const [keyConcepts, exampleSteps, tips] = await Promise.all([
        getKeyConceptsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: t.title }),
        getExampleStepsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: t.title }),
        getTipsForTopic({ curriculum, grade: g, subject, chapter: ch, chapterName, topic: t.title }),
      ]);
      return { ...t, keyConcepts, exampleSteps, tips } as TopicSection;
    })
  );

  return enrichTopicsWithLocal(g, ch, hydrated);
}
