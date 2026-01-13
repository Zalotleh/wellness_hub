--
-- PostgreSQL database dump
--

\restrict 9TO3JZcnfRCY6AmoGm65pcGLbfn3zmLgClZFb6oQfad1N4xIqYYk0FPwZMcrnWS

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: wellness_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO wellness_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: wellness_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BenefitStrength; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."BenefitStrength" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."BenefitStrength" OWNER TO wellness_user;

--
-- Name: ConsumptionSource; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."ConsumptionSource" AS ENUM (
    'MANUAL',
    'RECIPE',
    'MEAL_PLAN'
);


ALTER TYPE public."ConsumptionSource" OWNER TO wellness_user;

--
-- Name: DefenseSystem; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."DefenseSystem" AS ENUM (
    'ANGIOGENESIS',
    'REGENERATION',
    'MICROBIOME',
    'DNA_PROTECTION',
    'IMMUNITY'
);


ALTER TYPE public."DefenseSystem" OWNER TO wellness_user;

--
-- Name: MealPlanStatus; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."MealPlanStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."MealPlanStatus" OWNER TO wellness_user;

--
-- Name: MealPlanVisibility; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."MealPlanVisibility" AS ENUM (
    'PRIVATE',
    'PUBLIC',
    'FRIENDS'
);


ALTER TYPE public."MealPlanVisibility" OWNER TO wellness_user;

--
-- Name: MealTime; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."MealTime" AS ENUM (
    'BREAKFAST',
    'MORNING_SNACK',
    'LUNCH',
    'AFTERNOON_SNACK',
    'DINNER',
    'EVENING_SNACK',
    'CUSTOM'
);


ALTER TYPE public."MealTime" OWNER TO wellness_user;

--
-- Name: RecommendationPriority; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."RecommendationPriority" AS ENUM (
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE public."RecommendationPriority" OWNER TO wellness_user;

--
-- Name: RecommendationStatus; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."RecommendationStatus" AS ENUM (
    'PENDING',
    'ACTED_ON',
    'SHOPPED',
    'COMPLETED',
    'DISMISSED',
    'EXPIRED'
);


ALTER TYPE public."RecommendationStatus" OWNER TO wellness_user;

--
-- Name: RecommendationType; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."RecommendationType" AS ENUM (
    'RECIPE',
    'MEAL_PLAN',
    'FOOD_SUGGESTION',
    'WORKFLOW_STEP'
);


ALTER TYPE public."RecommendationType" OWNER TO wellness_user;

--
-- Name: SubscriptionTier; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."SubscriptionTier" AS ENUM (
    'FREE',
    'PREMIUM',
    'FAMILY'
);


ALTER TYPE public."SubscriptionTier" OWNER TO wellness_user;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO wellness_user;

--
-- Name: WorkflowStep; Type: TYPE; Schema: public; Owner: wellness_user
--

CREATE TYPE public."WorkflowStep" AS ENUM (
    'CREATE',
    'SHOP',
    'TRACK',
    'REVIEW'
);


ALTER TYPE public."WorkflowStep" OWNER TO wellness_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AIGenerationLog; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."AIGenerationLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "generationType" text NOT NULL,
    success boolean NOT NULL,
    "qualityScore" double precision,
    "defenseSystem" public."DefenseSystem",
    "ingredientCount" integer,
    "hasDietaryRestrictions" boolean DEFAULT false NOT NULL,
    "hasMealType" boolean DEFAULT false NOT NULL,
    "validationErrors" text[],
    "inputData" jsonb,
    "outputData" jsonb,
    "apiResponseTime" integer,
    "modelUsed" text,
    "tokensUsed" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AIGenerationLog" OWNER TO wellness_user;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO wellness_user;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    content text NOT NULL,
    "recipeId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Comment" OWNER TO wellness_user;

--
-- Name: DailyMenu; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."DailyMenu" (
    id text NOT NULL,
    "mealPlanId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    servings integer,
    notes text
);


ALTER TABLE public."DailyMenu" OWNER TO wellness_user;

--
-- Name: DailyProgressScore; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."DailyProgressScore" (
    id text NOT NULL,
    "userId" text NOT NULL,
    date date NOT NULL,
    "overallScore" double precision NOT NULL,
    "defenseSystemScore" double precision NOT NULL,
    "mealTimeScore" double precision NOT NULL,
    "foodVarietyScore" double precision NOT NULL,
    "angiogenesisCount" integer DEFAULT 0 NOT NULL,
    "regenerationCount" integer DEFAULT 0 NOT NULL,
    "microbiomeCount" integer DEFAULT 0 NOT NULL,
    "dnaProtectionCount" integer DEFAULT 0 NOT NULL,
    "immunityCount" integer DEFAULT 0 NOT NULL,
    "breakfastSystems" integer DEFAULT 0 NOT NULL,
    "lunchSystems" integer DEFAULT 0 NOT NULL,
    "dinnerSystems" integer DEFAULT 0 NOT NULL,
    "snackSystems" integer DEFAULT 0 NOT NULL,
    "uniqueFoodsCount" integer DEFAULT 0 NOT NULL,
    "totalServings" double precision DEFAULT 0 NOT NULL,
    gaps jsonb,
    achievements jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DailyProgressScore" OWNER TO wellness_user;

--
-- Name: DefenseSystemBenefit; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."DefenseSystemBenefit" (
    id text NOT NULL,
    "foodItemId" text NOT NULL,
    "defenseSystem" public."DefenseSystem" NOT NULL,
    strength public."BenefitStrength" DEFAULT 'MEDIUM'::public."BenefitStrength" NOT NULL
);


ALTER TABLE public."DefenseSystemBenefit" OWNER TO wellness_user;

--
-- Name: DeletionLog; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."DeletionLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    email text NOT NULL,
    reason text,
    "deletedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DeletionLog" OWNER TO wellness_user;

--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Favorite" (
    id text NOT NULL,
    "recipeId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Favorite" OWNER TO wellness_user;

--
-- Name: FeatureFlag; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."FeatureFlag" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    "requiredTier" public."SubscriptionTier",
    "rolloutPercentage" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FeatureFlag" OWNER TO wellness_user;

--
-- Name: FoodConsumption; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."FoodConsumption" (
    id text NOT NULL,
    "userId" text NOT NULL,
    date date NOT NULL,
    "mealTime" public."MealTime" NOT NULL,
    "timeConsumed" timestamp(3) without time zone,
    "sourceType" public."ConsumptionSource" NOT NULL,
    "recipeId" text,
    "mealId" text,
    "mealPlanId" text,
    servings double precision DEFAULT 1 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FoodConsumption" OWNER TO wellness_user;

--
-- Name: FoodDatabase; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."FoodDatabase" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    "defenseSystems" public."DefenseSystem"[],
    nutrients text[],
    description text,
    "systemBenefits" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FoodDatabase" OWNER TO wellness_user;

--
-- Name: FoodItem; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."FoodItem" (
    id text NOT NULL,
    "consumptionId" text NOT NULL,
    name text NOT NULL,
    quantity double precision,
    unit text
);


ALTER TABLE public."FoodItem" OWNER TO wellness_user;

--
-- Name: GeneratedRecipe; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."GeneratedRecipe" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mealId" text NOT NULL,
    name text NOT NULL,
    description text,
    servings integer NOT NULL,
    "prepTime" text NOT NULL,
    "cookTime" text NOT NULL,
    "totalTime" text NOT NULL,
    difficulty text,
    ingredients jsonb NOT NULL,
    instructions jsonb NOT NULL,
    calories integer,
    protein double precision,
    carbs double precision,
    fat double precision,
    fiber double precision,
    "defenseSystems" text[],
    tags text[],
    "isPublic" boolean DEFAULT false NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    saves integer DEFAULT 0 NOT NULL,
    "generatedBy" text,
    "customPrompt" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GeneratedRecipe" OWNER TO wellness_user;

--
-- Name: Meal; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Meal" (
    id text NOT NULL,
    "dailyMenuId" text NOT NULL,
    "mealType" text NOT NULL,
    slot text,
    "mealName" text NOT NULL,
    servings integer,
    "defenseSystems" text[],
    "prepTime" text,
    "cookTime" text,
    "position" integer DEFAULT 0 NOT NULL,
    "customInstructions" text,
    "recipeGenerated" boolean DEFAULT false NOT NULL,
    "recipeId" text,
    consumed boolean DEFAULT false NOT NULL,
    "consumedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Meal" OWNER TO wellness_user;

--
-- Name: MealPlan; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."MealPlan" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    description text,
    "weekStart" timestamp(3) without time zone NOT NULL,
    "weekEnd" timestamp(3) without time zone NOT NULL,
    "durationWeeks" integer DEFAULT 1 NOT NULL,
    "defaultServings" integer DEFAULT 2 NOT NULL,
    visibility public."MealPlanVisibility" DEFAULT 'PRIVATE'::public."MealPlanVisibility" NOT NULL,
    status public."MealPlanStatus" DEFAULT 'DRAFT'::public."MealPlanStatus" NOT NULL,
    tags text[],
    likes integer DEFAULT 0 NOT NULL,
    saves integer DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    "customInstructions" text,
    "dietaryRestrictions" text[],
    "focusSystems" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone
);


ALTER TABLE public."MealPlan" OWNER TO wellness_user;

--
-- Name: MealPlanComment; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."MealPlanComment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mealPlanId" text NOT NULL,
    content text NOT NULL,
    edited boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MealPlanComment" OWNER TO wellness_user;

--
-- Name: MealPlanLike; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."MealPlanLike" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mealPlanId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MealPlanLike" OWNER TO wellness_user;

--
-- Name: MealPlanReport; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."MealPlanReport" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mealPlanId" text NOT NULL,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MealPlanReport" OWNER TO wellness_user;

--
-- Name: PantryItem; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."PantryItem" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    quantity double precision,
    unit text,
    "alwaysHave" boolean DEFAULT false NOT NULL,
    "lowStockAlert" boolean DEFAULT false NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PantryItem" OWNER TO wellness_user;

--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetToken" OWNER TO wellness_user;

--
-- Name: Progress; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Progress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    date date NOT NULL,
    "defenseSystem" public."DefenseSystem" NOT NULL,
    "foodsConsumed" jsonb NOT NULL,
    count integer NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    deprecated boolean DEFAULT false NOT NULL,
    "migratedTo" text
);


ALTER TABLE public."Progress" OWNER TO wellness_user;

--
-- Name: Rating; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Rating" (
    id text NOT NULL,
    value integer NOT NULL,
    "recipeId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Rating" OWNER TO wellness_user;

--
-- Name: Recipe; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Recipe" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    ingredients jsonb NOT NULL,
    instructions text NOT NULL,
    "prepTime" text,
    "cookTime" text,
    servings integer,
    "defenseSystems" public."DefenseSystem"[],
    nutrients jsonb,
    "imageUrl" text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ingredientSystemMap" jsonb
);


ALTER TABLE public."Recipe" OWNER TO wellness_user;

--
-- Name: Recommendation; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Recommendation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."RecommendationType" NOT NULL,
    priority public."RecommendationPriority" NOT NULL,
    status public."RecommendationStatus" DEFAULT 'PENDING'::public."RecommendationStatus" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    reasoning text NOT NULL,
    "actionLabel" text NOT NULL,
    "actionUrl" text NOT NULL,
    "actionData" jsonb,
    "targetSystem" public."DefenseSystem",
    "targetMealTime" public."MealTime",
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "acceptedAt" timestamp(3) without time zone,
    "dismissedAt" timestamp(3) without time zone,
    "actedAt" timestamp(3) without time zone,
    "shoppedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "linkedRecipeId" text,
    "linkedShoppingListId" text,
    "linkedMealLogId" text,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "dismissCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Recommendation" OWNER TO wellness_user;

--
-- Name: SavedMealPlan; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."SavedMealPlan" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mealPlanId" text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SavedMealPlan" OWNER TO wellness_user;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO wellness_user;

--
-- Name: ShoppingList; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."ShoppingList" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mealPlanId" text,
    title text DEFAULT 'Shopping List'::text NOT NULL,
    items jsonb NOT NULL,
    "totalItems" integer NOT NULL,
    "totalCost" double precision,
    currency text DEFAULT 'USD'::text,
    "pantryFiltered" boolean DEFAULT false NOT NULL,
    "lastExported" timestamp(3) without time zone,
    "sourceType" text,
    "sourceIds" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ShoppingList" OWNER TO wellness_user;

--
-- Name: User; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    password text,
    image text,
    bio text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "aiQuestionsThisMonth" integer DEFAULT 0 NOT NULL,
    anonymized boolean DEFAULT false NOT NULL,
    country text,
    "defaultDietaryRestrictions" text[] DEFAULT ARRAY[]::text[],
    "defaultFocusSystems" public."DefenseSystem"[] DEFAULT ARRAY[]::public."DefenseSystem"[],
    "defaultServings" integer DEFAULT 2 NOT NULL,
    "imageGenerationsThisMonth" integer DEFAULT 0 NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "lastResetDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "mealPlansThisMonth" integer DEFAULT 0 NOT NULL,
    "measurementSystem" text DEFAULT 'imperial'::text NOT NULL,
    "notificationPreferences" jsonb,
    "pdfExportsThisMonth" integer DEFAULT 0 NOT NULL,
    "privacyAccepted" boolean DEFAULT false NOT NULL,
    "privacyAcceptedAt" timestamp(3) without time zone,
    "recipeGenerationsThisMonth" integer DEFAULT 0 NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "subscriptionEndsAt" timestamp(3) without time zone,
    "subscriptionStatus" text,
    "subscriptionTier" public."SubscriptionTier" DEFAULT 'FREE'::public."SubscriptionTier" NOT NULL,
    "termsAccepted" boolean DEFAULT false NOT NULL,
    "termsAcceptedAt" timestamp(3) without time zone,
    theme text DEFAULT 'light'::text NOT NULL,
    timezone text,
    "trialEndsAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO wellness_user;

--
-- Name: UserConsent; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."UserConsent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    necessary boolean DEFAULT true NOT NULL,
    analytics boolean DEFAULT false NOT NULL,
    marketing boolean DEFAULT false NOT NULL,
    "consentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserConsent" OWNER TO wellness_user;

--
-- Name: UserWorkflowState; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."UserWorkflowState" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "currentStep" public."WorkflowStep" DEFAULT 'CREATE'::public."WorkflowStep" NOT NULL,
    "hasCreatedRecipe" boolean DEFAULT false NOT NULL,
    "hasCreatedMealPlan" boolean DEFAULT false NOT NULL,
    "hasShoppingList" boolean DEFAULT false NOT NULL,
    "hasLoggedFood" boolean DEFAULT false NOT NULL,
    "lastRecipeCreated" timestamp(3) without time zone,
    "lastMealPlanCreated" timestamp(3) without time zone,
    "lastShoppingListUsed" timestamp(3) without time zone,
    "lastFoodLogged" timestamp(3) without time zone,
    "activeRecipeId" text,
    "activeMealPlanId" text,
    "activeShoppingListId" text,
    "recipesToShoppingList" integer DEFAULT 0 NOT NULL,
    "shoppingListToLogged" integer DEFAULT 0 NOT NULL,
    "completedWorkflows" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserWorkflowState" OWNER TO wellness_user;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO wellness_user;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: wellness_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO wellness_user;

--
-- Data for Name: AIGenerationLog; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."AIGenerationLog" (id, "userId", "generationType", success, "qualityScore", "defenseSystem", "ingredientCount", "hasDietaryRestrictions", "hasMealType", "validationErrors", "inputData", "outputData", "apiResponseTime", "modelUsed", "tokensUsed", "createdAt") FROM stdin;
cmkb5yvtk0001ms6d82s3ggtl	cmk8sltur00016lmf3wecitlc	recipe	t	\N	DNA_PROTECTION	5	t	t	{}	{"mealType": "breakfast", "ingredients": ["Kiwi", "Guava", "Black Tea", "Cinnamon", "Walnuts"], "defenseSystem": "DNA_PROTECTION", "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	{"title": "Mediterranean Broccoli Sprout and Berry Breakfast Bowl with Cinnamon Walnuts and Kiwi", "cookTime": "8 min", "prepTime": "15 min", "servings": 2, "nutrients": {"EGCG": "180 mg (from black tea)", "Zinc": "3 mg (from pumpkin seeds and yogurt)", "Folate": "125 mcg (from broccoli sprouts and berries)", "Curcumin": "40 mg (from turmeric)", "Selenium": "12 mcg (from walnuts and oats)", "Quercetin": "35 mg (from berries and tea)", "Vitamin C": "285 mg (from kiwi, guava, strawberries, and broccoli sprouts)", "Vitamin E": "8 mg (from walnuts and pumpkin seeds)", "Polyphenols": "580 mg (combined from tea, berries, and cinnamon)", "Resveratrol": "15 mg (from berries)", "Anthocyanins": "420 mg (from berries)", "Sulforaphane": "73 mg (from broccoli sprouts)", "Beta-Carotene": "850 mcg (from guava)", "Omega-3 fatty acids": "2.5 g (from walnuts)"}, "description": "This vibrant breakfast bowl combines cruciferous powerhouses like broccoli sprouts with antioxidant-rich berries, creating a DNA-protecting morning meal. The sulforaphane from sprouts works synergistically with anthocyanins from berries and EGCG from black tea to repair cellular damage and support healthy aging. Topped with omega-3 rich walnuts and vitamin C-packed kiwi and guava, this Mediterranean-inspired bowl delivers comprehensive genetic protection.", "ingredients": [{"name": "Greek yogurt (or plant-based alternative)", "unit": "g", "amount": "200"}, {"name": "broccoli sprouts", "unit": "g", "amount": "60"}, {"name": "fresh strawberries, sliced", "unit": "g", "amount": "100"}, {"name": "fresh blueberries", "unit": "g", "amount": "80"}, {"name": "fresh blackberries", "unit": "g", "amount": "80"}, {"name": "kiwi, peeled and diced", "unit": "piece", "amount": "2"}, {"name": "guava, diced", "unit": "g", "amount": "100"}, {"name": "walnuts, roughly chopped", "unit": "g", "amount": "60"}, {"name": "honey", "unit": "ml", "amount": "15"}, {"name": "cinnamon", "unit": "g", "amount": "5"}, {"name": "rolled oats", "unit": "g", "amount": "30"}, {"name": "olive oil", "unit": "ml", "amount": "15"}, {"name": "brewed black tea, cooled", "unit": "ml", "amount": "240"}, {"name": "pumpkin seeds", "unit": "g", "amount": "30"}, {"name": "sea salt", "unit": "pinch", "amount": "1"}, {"name": "pomegranate arils", "unit": "g", "amount": "20"}, {"name": "turmeric powder", "unit": "g", "amount": "2"}, {"name": "lemon juice", "unit": "ml", "amount": "5"}], "instructions": "1. Brew the black tea using 240 ml hot water and let it steep for 5 minutes, then cool completely in the refrigerator or with ice cubes.\\n2. Preheat a small pan over medium heat and toast the walnuts with cinnamon and a pinch of sea salt for 3-4 minutes until fragrant, stirring frequently. Set aside to cool.\\n3. In a separate pan, lightly toast the rolled oats and pumpkin seeds with olive oil for 3-4 minutes until golden. Remove from heat.\\n4. In a mixing bowl, combine Greek yogurt with turmeric powder, honey, and lemon juice, stirring until smooth and evenly colored.\\n5. Divide the yogurt mixture between two serving bowls as the base layer.\\n6. Arrange the broccoli sprouts on one side of each bowl, keeping them fresh and crisp.\\n7. Add the strawberries, blueberries, and blackberries in separate sections around the bowl for visual appeal.\\n8. Place the diced kiwi and guava pieces on top of the yogurt.\\n9. Sprinkle the toasted oats, cinnamon walnuts, and pumpkin seeds over the entire bowl.\\n10. Garnish with pomegranate arils for extra antioxidant power and visual beauty.\\n11. Serve immediately with the cooled black tea on the side for optimal DNA protection benefits.\\n", "defenseSystem": "DNA_PROTECTION"}	\N	claude-sonnet-4-5-20250929	988	2026-01-12 12:53:30.391
cmkcg023c0001jatotyutp1gg	cmk8sltur00016lmf3wecitlc	recipe	t	\N	DNA_PROTECTION	5	t	t	{}	{"mealType": "breakfast", "ingredients": ["Grapefruits", "Blackberries", "Blueberries", "Green Tea", "Cranberries"], "defenseSystem": "DNA_PROTECTION", "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	{"title": "Berry Bliss Smoothie Bowl with Green Tea-Soaked Chia and Grapefruit", "cookTime": "0 min", "prepTime": "15 min", "servings": 2, "nutrients": {"EGCG": "125 mg (from green tea for cellular repair)", "Zinc": "3 mg (from pumpkin seeds and yogurt for immune function)", "Fiber": "18 g (for gut health and toxin elimination)", "Folate": "85 mcg (from strawberries and broccoli sprouts for DNA synthesis)", "Protein": "22 g (for cellular repair and satiety)", "Selenium": "12 mcg (from pumpkin seeds for DNA repair enzyme support)", "Quercetin": "35 mg (from berries for anti-inflammatory support)", "Vitamin C": "145 mg (from berries, grapefruit, and strawberries for antioxidant defense)", "Vitamin E": "8 mg (from walnuts and pumpkin seeds for membrane protection)", "Anthocyanins": "580 mg (from blueberries, blackberries, and cranberries for DNA protection)", "Sulforaphane": "15 mg (from broccoli sprouts for DNA damage prevention)", "Omega-3 Fatty Acids": "4500 mg (from chia seeds and walnuts for cellular health)"}, "description": "This vibrant breakfast bowl combines antioxidant-rich berries with green tea to deliver a powerful dose of EGCG and anthocyanins that protect DNA from oxidative damage. The colorful toppings provide sulforaphane from broccoli sprouts and vitamin C from citrus, creating a delicious defense against cellular aging while supporting your body's natural DNA repair mechanisms.", "ingredients": [{"name": "brewed green tea, cooled", "unit": "ml", "amount": "240"}, {"name": "chia seeds", "unit": "g", "amount": "30"}, {"name": "frozen blueberries", "unit": "g", "amount": "200"}, {"name": "frozen blackberries", "unit": "g", "amount": "150"}, {"name": "fresh strawberries", "unit": "g", "amount": "100"}, {"name": "medium grapefruit, segmented", "unit": "piece", "amount": "1"}, {"name": "unsweetened cranberry juice", "unit": "ml", "amount": "120"}, {"name": "medium banana, frozen", "unit": "piece", "amount": "1"}, {"name": "Greek yogurt (or plant-based alternative)", "unit": "g", "amount": "200"}, {"name": "honey", "unit": "ml", "amount": "15"}, {"name": "broccoli sprouts", "unit": "g", "amount": "30"}, {"name": "raw walnut pieces", "unit": "g", "amount": "30"}, {"name": "pumpkin seeds", "unit": "g", "amount": "20"}, {"name": "fresh blueberries for topping", "unit": "g", "amount": "50"}, {"name": "fresh blackberries for topping", "unit": "g", "amount": "40"}, {"name": "ground cinnamon", "unit": "g", "amount": "2"}, {"name": "fresh ginger, grated", "unit": "g", "amount": "5"}, {"name": "lemon juice", "unit": "ml", "amount": "15"}], "instructions": "1. Brew the green tea and allow it to cool to room temperature. Mix the chia seeds into the cooled tea and refrigerate for at least 10 minutes until it forms a gel-like consistency.\\n2. While the chia mixture sets, segment the grapefruit by cutting away the peel and pith, then carefully removing each segment from its membrane. Set aside.\\n3. In a high-speed blender, combine the frozen blueberries, frozen blackberries, fresh strawberries, frozen banana, cranberry juice, Greek yogurt, honey, grated ginger, and lemon juice. Blend on high speed for 60-90 seconds until completely smooth and creamy. The mixture should be thick enough to eat with a spoon.\\n4. Taste and adjust sweetness if needed by adding more honey, blending briefly to incorporate.\\n5. Divide the smoothie mixture evenly between two bowls, spreading it smooth with the back of a spoon.\\n6. Arrange the toppings artfully on each bowl: place the green tea-soaked chia seeds in one section, fresh blueberries in another, fresh blackberries, grapefruit segments, broccoli sprouts, walnut pieces, and pumpkin seeds in separate sections.\\n7. Sprinkle ground cinnamon over the entire bowl for added flavor and additional antioxidant benefits.\\n8. Serve immediately while cold, using a spoon to mix toppings into each bite for varied texture and flavor.\\n", "defenseSystem": "DNA_PROTECTION"}	\N	claude-sonnet-4-5-20250929	978	2026-01-13 10:22:07.51
cmkch5jcz0001zu4dqe75xk3d	cmk8sltur00016lmf3wecitlc	recipe	t	\N	DNA_PROTECTION	5	t	t	{}	{"mealType": "breakfast", "ingredients": ["Black Tea", "Kiwi", "Blackberries", "Green Tea", "Carrots"], "defenseSystems": ["DNA_PROTECTION", "IMMUNITY", "REGENERATION"], "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	{"title": "Mediterranean Breakfast Bowl with Walnut-Berry Compote and Turmeric Scrambled Eggs", "cookTime": "15 min", "prepTime": "15 min", "servings": 2, "nutrients": {"EGCG": "125 mg", "Zinc": "3.2 mg", "Folate": "145 mcg", "Allicin": "15 mg", "Curcumin": "180 mg", "Selenium": "42 mcg", "Quercetin": "28 mg", "Vitamin A": "5600 IU", "Vitamin C": "185 mg", "Vitamin E": "8 mg", "Polyphenols": "850 mg", "Resveratrol": "12 mg", "Anthocyanins": "320 mg", "Sulforaphane": "45 mg", "Beta-Carotene": "4200 mcg", "Omega-3 Fatty Acids (ALA)": "2800 mg"}, "description": "This vibrant Mediterranean breakfast combines omega-3 rich walnuts with antioxidant-packed blackberries and blueberries to support cellular regeneration. Turmeric-spiced eggs nest on a bed of sautéed garlic-infused kale and carrots, providing DNA-protecting sulforaphane and beta-carotene while boosting immunity with allicin. A refreshing green tea and kiwi smoothie alongside delivers powerful EGCG and vitamin C to complete this multi-system defense meal.", "ingredients": [{"name": "eggs", "unit": "whole", "amount": "4"}, {"name": "unsweetened almond milk", "unit": "ml", "amount": "60"}, {"name": "ground turmeric", "unit": "g", "amount": "3"}, {"name": "black pepper", "unit": "pinch", "amount": "1"}, {"name": "extra virgin olive oil", "unit": "ml", "amount": "15"}, {"name": "garlic, minced", "unit": "clove", "amount": "3"}, {"name": "kale, chopped", "unit": "g", "amount": "150"}, {"name": "carrots, julienned", "unit": "g", "amount": "100"}, {"name": "sea salt", "unit": "g", "amount": "2"}, {"name": "blackberries", "unit": "g", "amount": "100"}, {"name": "blueberries", "unit": "g", "amount": "80"}, {"name": "walnuts, roughly chopped", "unit": "g", "amount": "40"}, {"name": "honey", "unit": "ml", "amount": "15"}, {"name": "lemon juice", "unit": "ml", "amount": "5"}, {"name": "brewed green tea, cooled", "unit": "ml", "amount": "250"}, {"name": "kiwis, peeled and chopped", "unit": "whole", "amount": "2"}, {"name": "Greek yogurt", "unit": "g", "amount": "80"}, {"name": "almonds, sliced", "unit": "g", "amount": "30"}, {"name": "fresh chives, chopped", "unit": "g", "amount": "5"}], "instructions": "1. Brew green tea and let it cool. Blend cooled tea with chopped kiwi and 40 g Greek yogurt until smooth. Set aside in refrigerator.\\n2. In a small saucepan, combine blackberries, blueberries, 30 g walnuts, honey, and lemon juice. Cook over medium heat for 5-7 minutes, stirring occasionally, until berries break down and mixture thickens. Remove from heat.\\n3. In a bowl, whisk together eggs, almond milk, turmeric, black pepper, and 1 g sea salt until well combined and slightly frothy.\\n4. Heat 10 ml olive oil in a large skillet over medium heat. Add minced garlic and sauté for 30 seconds until fragrant.\\n5. Add julienned carrots to the skillet and cook for 2-3 minutes until slightly softened. Add chopped kale and remaining 1 g sea salt, cooking for another 2-3 minutes until kale wilts.\\n6. Push vegetables to the sides of the skillet. Add remaining 5 ml olive oil to the center and pour in egg mixture. Gently scramble eggs, cooking for 2-3 minutes until just set but still creamy.\\n7. Divide the vegetable and egg mixture between two bowls. Top each with warm berry-walnut compote, remaining 10 g walnuts, sliced almonds, and fresh chives.\\n8. Serve immediately with the green tea-kiwi smoothie on the side, topped with remaining 40 g Greek yogurt.\\n", "defenseSystem": "DNA_PROTECTION", "defenseSystems": ["DNA_PROTECTION", "IMMUNITY", "REGENERATION"]}	\N	claude-sonnet-4-5-20250929	948	2026-01-13 10:54:22.787
cmkckxny500038rtjlmvuslc2	cmk8sltur00016lmf3wecitlc	recipe	t	\N	MICROBIOME	5	t	t	{}	{"mealType": "breakfast", "ingredients": ["Apples", "Almonds", "Bananas", "Black Tea", "Blackberries"], "defenseSystems": ["MICROBIOME"], "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	{"title": "Overnight Oats with Blackberry Compote, Caramelized Bananas, and Almond Crunch", "cookTime": "10 min", "prepTime": "15 min (plus overnight soaking)", "servings": 2, "nutrients": {"Protein": "18 grams per serving", "Prebiotics": "4 grams (inulin and resistant starch from oats and bananas)", "Probiotics": "15 billion CFU from Greek yogurt and kefir (Lactobacillus and Bifidobacterium strains)", "Vitamin K2": "1.2 mcg from fermented dairy", "Polyphenols": "450 mg from blackberries, apples, and black tea", "Dietary Fiber": "12 grams per serving (soluble and insoluble)", "Omega-3 Fatty Acids": "2.5 grams from flaxseeds", "Short-Chain Fatty Acids": "Supports butyrate production through fermentable fiber"}, "description": "This Mediterranean-inspired breakfast combines prebiotic-rich oats and bananas with probiotic Greek yogurt to nourish your gut microbiome. The blackberry compote provides polyphenols while flaxseeds deliver omega-3 fatty acids and fiber, creating a delicious morning meal that supports beneficial bacteria growth and digestive wellness.", "ingredients": [{"name": "rolled oats", "unit": "cup", "amount": "1"}, {"name": "plain Greek yogurt", "unit": "cup", "amount": "1"}, {"name": "kefir", "unit": "cup", "amount": "1"}, {"name": "ground flaxseeds", "unit": "tbsp", "amount": "2"}, {"name": "raw honey", "unit": "tbsp", "amount": "1"}, {"name": "vanilla extract", "unit": "tsp", "amount": "1"}, {"name": "sea salt", "unit": "pinch", "amount": "1"}, {"name": "fresh blackberries", "unit": "cup", "amount": "1"}, {"name": "bananas", "unit": "whole", "amount": "2"}, {"name": "coconut oil", "unit": "tbsp", "amount": "1"}, {"name": "sliced almonds", "unit": "tbsp", "amount": "3"}, {"name": "cinnamon", "unit": "tsp", "amount": "1"}, {"name": "apple, diced small", "unit": "whole", "amount": "1"}, {"name": "water", "unit": "tbsp", "amount": "2"}, {"name": "brewed black tea, cooled", "unit": "cup", "amount": "1"}, {"name": "maple syrup", "unit": "tbsp", "amount": "1"}], "instructions": "1. In a large mixing bowl, combine rolled oats, Greek yogurt, kefir, ground flaxseeds, honey, vanilla extract, and sea salt. Stir until well incorporated.\\n2. Add half of the cooled black tea to the oat mixture and stir to achieve desired consistency. Divide mixture between two mason jars or containers, cover, and refrigerate overnight (or minimum 4 hours).\\n3. In the morning, prepare the blackberry compote by combining blackberries, water, and maple syrup in a small saucepan over medium heat. Cook for 5-7 minutes, stirring occasionally and gently mashing berries, until thickened. Set aside to cool.\\n4. Heat a skillet over medium heat and toast sliced almonds for 2-3 minutes until golden and fragrant. Transfer to a small bowl and set aside.\\n5. In the same skillet, melt coconut oil over medium heat. Slice bananas lengthwise and place cut-side down in the pan. Sprinkle with cinnamon and cook for 2-3 minutes until caramelized. Flip and cook another 1-2 minutes.\\n6. Remove overnight oats from refrigerator and stir in the diced apple pieces.\\n7. Top each serving with caramelized banana halves, a generous spoonful of blackberry compote, and toasted almonds.\\n8. Drizzle with remaining black tea if desired for added moisture and antioxidants. Serve immediately.\\n", "defenseSystem": "MICROBIOME", "defenseSystems": ["MICROBIOME"]}	\N	claude-sonnet-4-5-20250929	845	2026-01-13 12:40:13.949
cmkcm9bba0009j399t4tpy4ie	cmk8sltur00016lmf3wecitlc	recipe	t	\N	ANGIOGENESIS	4	t	t	{}	{"mealType": "breakfast", "ingredients": ["Apples", "Strawberries", "Walnuts", "Cheese"], "defenseSystems": ["ANGIOGENESIS"], "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	{"title": "Berry-Walnut Breakfast Parfait with Honey-Cinnamon Ricotta and Apple Compote", "cookTime": "10 min", "prepTime": "15 min", "servings": 2, "nutrients": {"Fiber": "12 g (from fruits, nuts, seeds)", "Calcium": "280 mg (from ricotta cheese)", "Protein": "18 g (from ricotta cheese, walnuts)", "Quercetin": "25 mg (from apples, berries)", "Vitamin C": "95 mg (from citrus zest, berries)", "Polyphenols": "320 mg (from mixed berries, apples, walnuts)", "Resveratrol": "8 mg (from red berries)", "Anthocyanins": "180 mg (from strawberries, blueberries, raspberries)", "Ellagic Acid": "45 mg (from strawberries, raspberries, pomegranate)", "Omega-3 Fatty Acids": "2.5 g (from walnuts, chia seeds)"}, "description": "This vibrant Mediterranean-inspired breakfast parfait layers antioxidant-rich berries with creamy ricotta cheese and omega-3 packed walnuts to support healthy blood vessel formation. The combination of strawberries, apples, and mixed berries delivers powerful anthocyanins and quercetin that help regulate angiogenesis, while walnuts provide essential omega-3 fatty acids for optimal circulation.", "ingredients": [{"name": "ricotta cheese", "unit": "cup", "amount": "1"}, {"name": "honey", "unit": "tbsp", "amount": "2"}, {"name": "1/2 tsp ground cinnamon", "unit": "as needed", "amount": ""}, {"name": "1/4 tsp vanilla extract", "unit": "as needed", "amount": ""}, {"name": "apples, diced", "unit": "medium", "amount": "2"}, {"name": "fresh lemon juice", "unit": "tbsp", "amount": "1"}, {"name": "fresh strawberries, sliced", "unit": "cup", "amount": "1"}, {"name": "1/2 cup fresh blueberries", "unit": "as needed", "amount": ""}, {"name": "1/2 cup fresh raspberries", "unit": "as needed", "amount": ""}, {"name": "1/2 cup chopped walnuts", "unit": "as needed", "amount": ""}, {"name": "unsweetened pomegranate juice", "unit": "tbsp", "amount": "2"}, {"name": "chia seeds", "unit": "tbsp", "amount": "1"}, {"name": "orange zest", "unit": "tsp", "amount": "2"}, {"name": "pinch sea salt", "unit": "as needed", "amount": ""}], "instructions": "1. In a small saucepan over medium heat, combine diced apples, lemon juice, and 1 tablespoon honey. Cook for 8-10 minutes, stirring occasionally, until apples soften and create a light compote. Remove from heat and let cool slightly.\\n2. In a medium bowl, mix ricotta cheese with remaining 1 tablespoon honey, cinnamon, vanilla extract, and orange zest until smooth and creamy.\\n3. In a separate bowl, gently toss strawberries, blueberries, and raspberries with pomegranate juice.\\n4. Toast walnuts in a dry skillet over medium heat for 3-4 minutes until fragrant, watching carefully to prevent burning.\\n5. To assemble parfaits, layer ingredients in two serving glasses or bowls: Start with 1/4 of the honey-cinnamon ricotta, then add 1/4 of the apple compote, followed by 1/4 of the mixed berries, and 1/4 of the toasted walnuts. Repeat layers once more.\\n6. Sprinkle chia seeds on top of each parfait for added texture and nutrition.\\n7. Serve immediately or refrigerate for up to 2 hours before serving for a chilled breakfast option.\\n", "defenseSystem": "ANGIOGENESIS", "defenseSystems": ["ANGIOGENESIS"]}	\N	claude-sonnet-4-5-20250929	833	2026-01-13 13:17:17.062
\.


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Comment" (id, content, "recipeId", "userId", "createdAt", "updatedAt") FROM stdin;
cmk8sltw7000m6lmf6d2hpbp5	This recipe is amazing! Made it for dinner and everyone loved it.	cmk8sltuz00046lmfvzq2xpvn	cmk8sltur00016lmf3wecitlc	2026-01-10 21:03:54.007	2026-01-10 21:03:54.007
cmk8sltwa000o6lmfzaoe33zr	Perfect for breakfast! The probiotics really help with digestion.	cmk8sltvi00066lmfeyldcutm	cmk8sltuv00026lmf3ui32pge	2026-01-10 21:03:54.01	2026-01-10 21:03:54.01
\.


--
-- Data for Name: DailyMenu; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."DailyMenu" (id, "mealPlanId", date, servings, notes) FROM stdin;
\.


--
-- Data for Name: DailyProgressScore; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."DailyProgressScore" (id, "userId", date, "overallScore", "defenseSystemScore", "mealTimeScore", "foodVarietyScore", "angiogenesisCount", "regenerationCount", "microbiomeCount", "dnaProtectionCount", "immunityCount", "breakfastSystems", "lunchSystems", "dinnerSystems", "snackSystems", "uniqueFoodsCount", "totalServings", gaps, achievements, "createdAt", "updatedAt") FROM stdin;
cmkckvjgc00018rtjmw3cqym0	cmk8sltur00016lmf3wecitlc	2026-01-12	64	64	50	84	3	3	1	21	2	5	1	0	0	21	0	{"missedSystems": [], "missedMealTimes": ["DINNER", "SNACK"]}	[{"system": "DNA_PROTECTION", "achievement": "COMPLETE"}]	2026-01-13 12:38:34.812	2026-01-13 12:38:34.812
cmkcj7r6f00038hehr6jgamvs	cmk8sltur00016lmf3wecitlc	2026-01-13	88	100	60	100	14	19	16	19	19	3	1	1	0	47	0	{"missedSystems": [], "missedMealTimes": ["MORNING_SNACK", "AFTERNOON_SNACK"]}	[{"system": "ANGIOGENESIS", "achievement": "COMPLETE"}, {"system": "REGENERATION", "achievement": "COMPLETE"}, {"system": "MICROBIOME", "achievement": "COMPLETE"}, {"system": "DNA_PROTECTION", "achievement": "COMPLETE"}, {"system": "IMMUNITY", "achievement": "COMPLETE"}]	2026-01-13 11:52:05.464	2026-01-13 13:46:42.884
\.


--
-- Data for Name: DefenseSystemBenefit; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."DefenseSystemBenefit" (id, "foodItemId", "defenseSystem", strength) FROM stdin;
cmkb60h310007ms6del5ybw0j	cmkb60h310006ms6duqn1qp6o	DNA_PROTECTION	MEDIUM
cmkb60h310009ms6dlj01nncy	cmkb60h310008ms6dztiwi0bs	DNA_PROTECTION	MEDIUM
cmkb60h31000bms6dphagwngv	cmkb60h31000ams6dur545yho	DNA_PROTECTION	MEDIUM
cmkb60h31000dms6dl95vjurf	cmkb60h31000cms6d9c760qmv	DNA_PROTECTION	MEDIUM
cmkb60h32000fms6dr9cmv3uo	cmkb60h32000ems6ds45peywq	DNA_PROTECTION	MEDIUM
cmkb60h32000hms6dwwpbtswm	cmkb60h32000gms6dng0i1n3f	DNA_PROTECTION	MEDIUM
cmkb60h32000jms6d89cecw8m	cmkb60h32000ims6d15nm01zp	DNA_PROTECTION	MEDIUM
cmkb60h32000lms6dm4z5tfhc	cmkb60h32000kms6df0aj981a	DNA_PROTECTION	MEDIUM
cmkb60h32000nms6dybwsc1lg	cmkb60h32000mms6dotna4dpx	DNA_PROTECTION	MEDIUM
cmkb60h32000pms6dk2fjhj9j	cmkb60h32000oms6dcjfcdhg6	DNA_PROTECTION	MEDIUM
cmkb60h32000rms6dlr1eso6l	cmkb60h32000qms6dx7re5pv2	DNA_PROTECTION	MEDIUM
cmkb60h32000tms6d4j6otwuj	cmkb60h32000sms6dq419gz8f	DNA_PROTECTION	MEDIUM
cmkb60h32000vms6ddg5qncp7	cmkb60h32000ums6drjn70n2q	DNA_PROTECTION	MEDIUM
cmkb60h32000xms6d32lmqti7	cmkb60h32000wms6d19fd2t8q	DNA_PROTECTION	MEDIUM
cmkb60h32000zms6d73nao6wr	cmkb60h32000yms6dcsa33sa4	DNA_PROTECTION	MEDIUM
cmkb60h320011ms6dav31hxm0	cmkb60h320010ms6dm87j8az0	DNA_PROTECTION	MEDIUM
cmkb60h320013ms6d3qukn542	cmkb60h320012ms6dmkt8ki6z	DNA_PROTECTION	MEDIUM
cmkb60h330015ms6dnow4ueln	cmkb60h330014ms6d8jdcoful	DNA_PROTECTION	MEDIUM
cmkb6b42a001hms6d899hwruh	cmkb6b42a001gms6dizp78kyt	IMMUNITY	MEDIUM
cmkb6b42a001ims6djrv2oj1a	cmkb6b42a001gms6dizp78kyt	ANGIOGENESIS	HIGH
cmkb6b42a001jms6dhenbe04n	cmkb6b42a001gms6dizp78kyt	REGENERATION	MEDIUM
cmkb6b42a001kms6djmm99cia	cmkb6b42a001gms6dizp78kyt	DNA_PROTECTION	MEDIUM
cmkb6b42a001mms6dg87fymsn	cmkb6b42a001lms6duzku3vlk	MICROBIOME	MEDIUM
cmkb6b42a001nms6dao6aibtq	cmkb6b42a001lms6duzku3vlk	ANGIOGENESIS	HIGH
cmkb6b42a001oms6dowizl4tr	cmkb6b42a001lms6duzku3vlk	REGENERATION	HIGH
cmkb6b42a001pms6d2wdzx1p0	cmkb6b42a001lms6duzku3vlk	DNA_PROTECTION	MEDIUM
cmkb6b42a001rms6d91jdmeyz	cmkb6b42a001qms6dqr6cyy3k	IMMUNITY	MEDIUM
cmkb6b42a001sms6dbyepwuzf	cmkb6b42a001qms6dqr6cyy3k	ANGIOGENESIS	HIGH
cmkb6b42a001tms6ddyp1isft	cmkb6b42a001qms6dqr6cyy3k	REGENERATION	MEDIUM
cmkb6b42a001ums6d24o9y6mr	cmkb6b42a001qms6dqr6cyy3k	DNA_PROTECTION	HIGH
cmkch9whc0007zu4dyj6pn2mo	cmkch9whc0006zu4dydddjiss	DNA_PROTECTION	MEDIUM
cmkch9whc0008zu4dcffnbxr6	cmkch9whc0006zu4dydddjiss	IMMUNITY	MEDIUM
cmkch9whc0009zu4dpsnhocvh	cmkch9whc0006zu4dydddjiss	REGENERATION	MEDIUM
cmkch9whc000bzu4ddy25z3wj	cmkch9whc000azu4dzxkxsng5	DNA_PROTECTION	MEDIUM
cmkch9whc000czu4dfhp6h1hu	cmkch9whc000azu4dzxkxsng5	IMMUNITY	MEDIUM
cmkch9whc000dzu4d84166vyi	cmkch9whc000azu4dzxkxsng5	REGENERATION	MEDIUM
cmkch9whc000fzu4d0fig5okb	cmkch9whc000ezu4dusm8imar	DNA_PROTECTION	MEDIUM
cmkch9whc000gzu4dxxy8b8gs	cmkch9whc000ezu4dusm8imar	IMMUNITY	MEDIUM
cmkch9whc000hzu4d6tsn566j	cmkch9whc000ezu4dusm8imar	REGENERATION	MEDIUM
cmkch9whc000jzu4d7l32hep7	cmkch9whc000izu4d9889mn6w	DNA_PROTECTION	MEDIUM
cmkch9whc000kzu4du90d590h	cmkch9whc000izu4d9889mn6w	IMMUNITY	MEDIUM
cmkch9whc000lzu4d3cwzrfdl	cmkch9whc000izu4d9889mn6w	REGENERATION	MEDIUM
cmkch9whc000nzu4d6p19smef	cmkch9whc000mzu4deox8szgk	DNA_PROTECTION	MEDIUM
cmkch9whc000ozu4d9nv6sjb6	cmkch9whc000mzu4deox8szgk	IMMUNITY	MEDIUM
cmkch9whc000pzu4dx9cbv1bv	cmkch9whc000mzu4deox8szgk	REGENERATION	MEDIUM
cmkch9whc000rzu4di19yvui2	cmkch9whc000qzu4dc0xz7h7l	DNA_PROTECTION	MEDIUM
cmkch9whc000szu4dbi0xiwvn	cmkch9whc000qzu4dc0xz7h7l	IMMUNITY	MEDIUM
cmkch9whc000tzu4d5o1cnkfs	cmkch9whc000qzu4dc0xz7h7l	REGENERATION	MEDIUM
cmkch9whc000vzu4dod1xvq55	cmkch9whc000uzu4dcqekxer1	DNA_PROTECTION	MEDIUM
cmkch9whc000wzu4dgtgach7k	cmkch9whc000uzu4dcqekxer1	IMMUNITY	MEDIUM
cmkch9whc000xzu4dh0uy0di6	cmkch9whc000uzu4dcqekxer1	REGENERATION	MEDIUM
cmkch9whc000zzu4dyua5irqk	cmkch9whc000yzu4dmt8zaafs	DNA_PROTECTION	MEDIUM
cmkch9whc0010zu4dbbdi456m	cmkch9whc000yzu4dmt8zaafs	IMMUNITY	MEDIUM
cmkch9whc0011zu4dueaxtiho	cmkch9whc000yzu4dmt8zaafs	REGENERATION	MEDIUM
cmkch9whc0013zu4dp468koo2	cmkch9whc0012zu4d4rb9rtao	DNA_PROTECTION	MEDIUM
cmkch9whc0014zu4d9o71i2i3	cmkch9whc0012zu4d4rb9rtao	IMMUNITY	MEDIUM
cmkch9whc0015zu4da97d0s97	cmkch9whc0012zu4d4rb9rtao	REGENERATION	MEDIUM
cmkch9whc0017zu4di6rzwjo6	cmkch9whc0016zu4dvy91p72v	DNA_PROTECTION	MEDIUM
cmkch9whc0018zu4dtu7iqfy6	cmkch9whc0016zu4dvy91p72v	IMMUNITY	MEDIUM
cmkch9whc0019zu4d4my66aw7	cmkch9whc0016zu4dvy91p72v	REGENERATION	MEDIUM
cmkch9whc001bzu4d6yfmouhl	cmkch9whc001azu4dxfuckz26	DNA_PROTECTION	MEDIUM
cmkch9whc001czu4dl024z5mw	cmkch9whc001azu4dxfuckz26	IMMUNITY	MEDIUM
cmkch9whc001dzu4dub450ei3	cmkch9whc001azu4dxfuckz26	REGENERATION	MEDIUM
cmkch9whc001fzu4du45m0blg	cmkch9whc001ezu4dmguq0s2i	DNA_PROTECTION	MEDIUM
cmkch9whc001gzu4dloxwmks2	cmkch9whc001ezu4dmguq0s2i	IMMUNITY	MEDIUM
cmkch9whc001hzu4db2w7sbpp	cmkch9whc001ezu4dmguq0s2i	REGENERATION	MEDIUM
cmkch9whd001jzu4dhlx0hd2q	cmkch9whc001izu4dmv97tdgn	DNA_PROTECTION	MEDIUM
cmkch9whd001kzu4ds7ufvxaj	cmkch9whc001izu4dmv97tdgn	IMMUNITY	MEDIUM
cmkch9whd001lzu4d6rov8bjp	cmkch9whc001izu4dmv97tdgn	REGENERATION	MEDIUM
cmkch9whd001nzu4dfosdh5h0	cmkch9whd001mzu4d8wuzvdw9	DNA_PROTECTION	MEDIUM
cmkch9whd001ozu4d6mdex8ib	cmkch9whd001mzu4d8wuzvdw9	IMMUNITY	MEDIUM
cmkch9whd001pzu4dn8zu5iaf	cmkch9whd001mzu4d8wuzvdw9	REGENERATION	MEDIUM
cmkch9whd001rzu4dwbw8wjot	cmkch9whd001qzu4dq5re4az9	DNA_PROTECTION	MEDIUM
cmkch9whd001szu4dpz3v4wh0	cmkch9whd001qzu4dq5re4az9	IMMUNITY	MEDIUM
cmkch9whd001tzu4djdafqj7o	cmkch9whd001qzu4dq5re4az9	REGENERATION	MEDIUM
cmkch9whd001vzu4dk07z87rz	cmkch9whd001uzu4drig0mjpd	DNA_PROTECTION	MEDIUM
cmkch9whd001wzu4d00z73xqj	cmkch9whd001uzu4drig0mjpd	IMMUNITY	MEDIUM
cmkch9whd001xzu4dsci7ciyb	cmkch9whd001uzu4drig0mjpd	REGENERATION	MEDIUM
cmkch9whd001zzu4dn8hehx17	cmkch9whd001yzu4d4hs0myaq	DNA_PROTECTION	MEDIUM
cmkch9whd0020zu4dtenmuh2p	cmkch9whd001yzu4d4hs0myaq	IMMUNITY	MEDIUM
cmkch9whd0021zu4d199ewx4r	cmkch9whd001yzu4d4hs0myaq	REGENERATION	MEDIUM
cmkch9whd0023zu4d4b2g2biv	cmkch9whd0022zu4dqv6e4d39	DNA_PROTECTION	MEDIUM
cmkch9whd0024zu4dcqtnbb4l	cmkch9whd0022zu4dqv6e4d39	IMMUNITY	MEDIUM
cmkch9whd0025zu4d0i2n0q98	cmkch9whd0022zu4dqv6e4d39	REGENERATION	MEDIUM
cmkch9whd0027zu4d5j2vi9k9	cmkch9whd0026zu4dbyxld6kg	DNA_PROTECTION	MEDIUM
cmkch9whd0028zu4dxi13vtce	cmkch9whd0026zu4dbyxld6kg	IMMUNITY	MEDIUM
cmkch9whd0029zu4dafpbj9zp	cmkch9whd0026zu4dbyxld6kg	REGENERATION	MEDIUM
cmkckzo1s00098rtjvqicyzm3	cmkckzo1s00088rtjqcaksmyw	MICROBIOME	MEDIUM
cmkckzo1s000b8rtjbyouhq9i	cmkckzo1s000a8rtjcy1gadm2	MICROBIOME	MEDIUM
cmkckzo1s000d8rtjsm7xgt19	cmkckzo1s000c8rtj9fir323j	MICROBIOME	MEDIUM
cmkckzo1s000f8rtjag6f4bns	cmkckzo1s000e8rtjmpim7la2	MICROBIOME	MEDIUM
cmkckzo1s000h8rtjumdg5g92	cmkckzo1s000g8rtjjzvyqstj	MICROBIOME	MEDIUM
cmkckzo1s000j8rtjeiei5myb	cmkckzo1s000i8rtjpdqa60ms	MICROBIOME	MEDIUM
cmkckzo1s000l8rtjjsrcgq5j	cmkckzo1s000k8rtjj74bugrp	MICROBIOME	MEDIUM
cmkckzo1s000n8rtjaaao96pe	cmkckzo1s000m8rtj0pj9l2du	MICROBIOME	MEDIUM
cmkckzo1s000p8rtj8o4gyf6d	cmkckzo1s000o8rtjd4zbudb4	MICROBIOME	MEDIUM
cmkckzo1s000r8rtj2srrqupl	cmkckzo1s000q8rtj7kca8zhn	MICROBIOME	MEDIUM
cmkckzo1s000t8rtj1uoyce70	cmkckzo1s000s8rtjp36qcf1h	MICROBIOME	MEDIUM
cmkckzo1s000v8rtjo3dhckcu	cmkckzo1s000u8rtjg0tzgu46	MICROBIOME	MEDIUM
cmkckzo1s000x8rtjh3n7xiwq	cmkckzo1s000w8rtjt23az144	MICROBIOME	MEDIUM
cmkckzo1s000z8rtjlque7dyl	cmkckzo1s000y8rtjklhu6np9	MICROBIOME	MEDIUM
cmkckzo1t00118rtjx0ofo7ws	cmkckzo1t00108rtj3heptoir	MICROBIOME	MEDIUM
cmkckzo1t00138rtj80x6jxzt	cmkckzo1t00128rtjtl4143x4	MICROBIOME	MEDIUM
cmkcm9fts000fj399bpnheska	cmkcm9fts000ej399l6czqn7c	ANGIOGENESIS	MEDIUM
cmkcm9fts000hj399rxly6gm1	cmkcm9fts000gj39944b1mx5k	ANGIOGENESIS	MEDIUM
cmkcm9fts000jj399jm53cmog	cmkcm9fts000ij399a3gshyia	ANGIOGENESIS	MEDIUM
cmkcm9fts000lj399b6tro7g4	cmkcm9fts000kj399dlryxtw9	ANGIOGENESIS	MEDIUM
cmkcm9fts000nj399v3h5cs3v	cmkcm9fts000mj3991b73sgg5	ANGIOGENESIS	MEDIUM
cmkcm9fts000pj399q5xnyepe	cmkcm9fts000oj399e49jxswd	ANGIOGENESIS	MEDIUM
cmkcm9fts000rj399j40z856z	cmkcm9fts000qj399me2z03c9	ANGIOGENESIS	MEDIUM
cmkcm9fts000tj399nvrzwy8i	cmkcm9fts000sj399lv6dsl6z	ANGIOGENESIS	MEDIUM
cmkcm9fts000vj3993gnag3u5	cmkcm9fts000uj3993ko8jhsv	ANGIOGENESIS	MEDIUM
cmkcm9fts000xj399zfijcw27	cmkcm9fts000wj3998fjlaw2y	ANGIOGENESIS	MEDIUM
cmkcm9ftt000zj399zlil6ol3	cmkcm9ftt000yj399neoizqp2	ANGIOGENESIS	MEDIUM
cmkcm9ftt0011j399oai947da	cmkcm9ftt0010j3999tc213mx	ANGIOGENESIS	MEDIUM
cmkcm9ftt0013j399p0tzewe0	cmkcm9ftt0012j399kgbqgijl	ANGIOGENESIS	MEDIUM
cmkcm9ftt0015j399d13vcbjj	cmkcm9ftt0014j399eq0qqu7g	ANGIOGENESIS	MEDIUM
\.


--
-- Data for Name: DeletionLog; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."DeletionLog" (id, "userId", email, reason, "deletedAt") FROM stdin;
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Favorite" (id, "recipeId", "userId", "createdAt") FROM stdin;
cmk8sltwd000q6lmfgp9sa19r	cmk8sltuz00046lmfvzq2xpvn	cmk8sltur00016lmf3wecitlc	2026-01-10 21:03:54.013
cmk8sltwf000s6lmfwl2j7ag6	cmk8sltvi00066lmfeyldcutm	cmk8sltug00006lmfx0vil5us	2026-01-10 21:03:54.016
\.


--
-- Data for Name: FeatureFlag; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."FeatureFlag" (id, name, description, enabled, "requiredTier", "rolloutPercentage", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FoodConsumption; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."FoodConsumption" (id, "userId", date, "mealTime", "timeConsumed", "sourceType", "recipeId", "mealId", "mealPlanId", servings, notes, "createdAt", "updatedAt") FROM stdin;
cmkb60h300005ms6d1bbjynvt	cmk8sltur00016lmf3wecitlc	2026-01-12	BREAKFAST	2026-01-12 12:54:44.6	RECIPE	cmkb60e680003ms6d4nsh9gwc	\N	\N	1	\N	2026-01-12 12:54:44.604	2026-01-13 13:32:47.138
cmkb6b42a001fms6d0c3rlhz0	cmk8sltur00016lmf3wecitlc	2026-01-12	LUNCH	\N	MANUAL	\N	\N	\N	1	\N	2026-01-12 13:03:00.946	2026-01-13 13:32:47.149
cmkcm9fts000dj3994hhz5of0	cmk8sltur00016lmf3wecitlc	2026-01-13	DINNER	2026-01-13 13:17:22.909	RECIPE	cmkcm9d32000bj399v80q6uye	\N	\N	1	\N	2026-01-13 13:17:22.912	2026-01-13 13:33:22.981
cmkch9whb0005zu4d0rls27l4	cmk8sltur00016lmf3wecitlc	2026-01-13	BREAKFAST	2026-01-13 10:57:46.41	RECIPE	cmkch9u5s0003zu4d3jw93teg	\N	\N	1	\N	2026-01-13 10:57:46.414	2026-01-13 13:33:22.981
cmkckzo1r00078rtjsp80e2cc	cmk8sltur00016lmf3wecitlc	2026-01-13	LUNCH	2026-01-13 12:41:47.389	RECIPE	cmkckzky700058rtj1qn12ucn	\N	\N	1	\N	2026-01-13 12:41:47.391	2026-01-13 13:33:22.981
\.


--
-- Data for Name: FoodDatabase; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."FoodDatabase" (id, name, category, "defenseSystems", nutrients, description, "systemBenefits", "createdAt", "updatedAt") FROM stdin;
cmk8sm8jy0000r7ir31084596	Blueberries	Fruits	{ANGIOGENESIS,REGENERATION,DNA_PROTECTION,IMMUNITY}	{Anthocyanins,"Vitamin C",Polyphenols,Fiber}	Powerful antioxidant berry supporting multiple defense systems	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "HIGH", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.007	2026-01-10 21:04:13.007
cmk8sm8kf0001r7ireex0vcl9	Strawberries	Fruits	{ANGIOGENESIS,DNA_PROTECTION,IMMUNITY}	{"Vitamin C","Ellagic Acid",Anthocyanins}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.023	2026-01-10 21:04:13.023
cmk8sm8kk0002r7irnas0l3bi	Raspberries	Fruits	{ANGIOGENESIS,DNA_PROTECTION,IMMUNITY}	{"Ellagic Acid","Vitamin C",Fiber}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.028	2026-01-10 21:04:13.028
cmk8sm8kn0003r7irqmfbv3kg	Blackberries	Fruits	{ANGIOGENESIS,REGENERATION,DNA_PROTECTION,IMMUNITY}	{Anthocyanins,"Vitamin C",Fiber}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.031	2026-01-10 21:04:13.031
cmk8sm8kq0004r7irzvxoekxu	Cranberries	Fruits	{ANGIOGENESIS,REGENERATION,MICROBIOME,IMMUNITY}	{Proanthocyanidins,"Vitamin C"}	\N	{"IMMUNITY": "HIGH", "MICROBIOME": "MEDIUM", "ANGIOGENESIS": "MEDIUM", "REGENERATION": "MEDIUM"}	2026-01-10 21:04:13.035	2026-01-10 21:04:13.035
cmk8sm8ku0005r7ir92tww35a	Pomegranate	Fruits	{ANGIOGENESIS,DNA_PROTECTION,IMMUNITY}	{"Ellagic Acid",Punicalagin,"Vitamin C"}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.039	2026-01-10 21:04:13.039
cmk8sm8kx0006r7iranuvr9g4	Oranges	Fruits	{ANGIOGENESIS,DNA_PROTECTION,IMMUNITY}	{"Vitamin C",Hesperidin,Fiber}	\N	{"IMMUNITY": "HIGH", "ANGIOGENESIS": "MEDIUM", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.042	2026-01-10 21:04:13.042
cmk8sm8l00007r7iraiqjofw6	Apples	Fruits	{ANGIOGENESIS,MICROBIOME,DNA_PROTECTION,IMMUNITY}	{Quercetin,Pectin,"Vitamin C"}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "MEDIUM", "ANGIOGENESIS": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.045	2026-01-10 21:04:13.045
cmk8sm8l40008r7ir6ua1m4gx	Tomatoes	Vegetables	{ANGIOGENESIS,DNA_PROTECTION,IMMUNITY}	{Lycopene,"Vitamin C",Beta-Carotene}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.048	2026-01-10 21:04:13.048
cmk8sm8l90009r7irh4oo46et	Kale	Vegetables	{ANGIOGENESIS,REGENERATION,DNA_PROTECTION,IMMUNITY}	{Sulforaphane,"Vitamin K","Vitamin C",Beta-Carotene}	\N	{"IMMUNITY": "HIGH", "ANGIOGENESIS": "HIGH", "REGENERATION": "MEDIUM", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.053	2026-01-10 21:04:13.053
cmk8sm8lc000ar7irith3some	Spinach	Vegetables	{ANGIOGENESIS,MICROBIOME,DNA_PROTECTION,IMMUNITY}	{Lutein,Folate,Iron,"Vitamin K"}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "MEDIUM", "ANGIOGENESIS": "HIGH", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.056	2026-01-10 21:04:13.056
cmk8sm8lf000br7irr9a2s9j4	Broccoli	Vegetables	{DNA_PROTECTION,IMMUNITY}	{Sulforaphane,"Vitamin C",Folate}	\N	{"IMMUNITY": "HIGH", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.059	2026-01-10 21:04:13.059
cmk8sm8li000cr7irbpn21but	Brussels Sprouts	Vegetables	{DNA_PROTECTION,IMMUNITY}	{Sulforaphane,"Vitamin K","Vitamin C"}	\N	{"IMMUNITY": "MEDIUM", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.063	2026-01-10 21:04:13.063
cmk8sm8lm000dr7irn252jloq	Cauliflower	Vegetables	{DNA_PROTECTION,IMMUNITY}	{Sulforaphane,"Vitamin C",Choline}	\N	{"IMMUNITY": "MEDIUM", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.066	2026-01-10 21:04:13.066
cmk8sm8lo000er7ir0heofidr	Garlic	Vegetables	{MICROBIOME,IMMUNITY}	{Allicin,Selenium,"Vitamin C"}	\N	{"IMMUNITY": "HIGH", "MICROBIOME": "HIGH"}	2026-01-10 21:04:13.069	2026-01-10 21:04:13.069
cmk8sm8ls000fr7irqqbdqxei	Onions	Vegetables	{MICROBIOME,IMMUNITY}	{Quercetin,Inulin,"Vitamin C"}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "HIGH"}	2026-01-10 21:04:13.072	2026-01-10 21:04:13.072
cmk8sm8lv000gr7iruvezoj6s	Wild Salmon	Seafood	{ANGIOGENESIS,REGENERATION,IMMUNITY}	{"Omega-3 (EPA/DHA)","Vitamin D",Astaxanthin,Protein}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "HIGH"}	2026-01-10 21:04:13.075	2026-01-10 21:04:13.075
cmk8sm8lz000hr7ir2wng9npy	Sardines	Seafood	{ANGIOGENESIS,REGENERATION,IMMUNITY}	{Omega-3,Calcium,"Vitamin D"}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "HIGH"}	2026-01-10 21:04:13.079	2026-01-10 21:04:13.079
cmk8sm8m2000ir7irrgfxt877	Mackerel	Seafood	{ANGIOGENESIS,REGENERATION}	{Omega-3,"Vitamin D",Selenium}	\N	{"ANGIOGENESIS": "HIGH", "REGENERATION": "HIGH"}	2026-01-10 21:04:13.082	2026-01-10 21:04:13.082
cmk8sm8m5000jr7irp0h5t8wt	Walnuts	Nuts & Seeds	{ANGIOGENESIS,REGENERATION,DNA_PROTECTION,MICROBIOME}	{"Omega-3 (ALA)",Polyphenols,Fiber}	\N	{"MICROBIOME": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "HIGH", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.086	2026-01-10 21:04:13.086
cmk8sm8m8000kr7irr8643932	Almonds	Nuts & Seeds	{ANGIOGENESIS,DNA_PROTECTION,MICROBIOME,IMMUNITY}	{"Vitamin E",Fiber,Magnesium}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "MEDIUM", "ANGIOGENESIS": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.089	2026-01-10 21:04:13.089
cmk8sm8mc000lr7irmeecypay	Chia Seeds	Nuts & Seeds	{ANGIOGENESIS,REGENERATION,MICROBIOME}	{"Omega-3 (ALA)",Fiber,Protein}	\N	{"MICROBIOME": "HIGH", "ANGIOGENESIS": "MEDIUM", "REGENERATION": "MEDIUM"}	2026-01-10 21:04:13.092	2026-01-10 21:04:13.092
cmk8sm8mf000mr7irtfogniwh	Flaxseeds	Nuts & Seeds	{ANGIOGENESIS,REGENERATION,MICROBIOME}	{"Omega-3 (ALA)",Lignans,Fiber}	\N	{"MICROBIOME": "HIGH", "ANGIOGENESIS": "MEDIUM", "REGENERATION": "MEDIUM"}	2026-01-10 21:04:13.095	2026-01-10 21:04:13.095
cmk8sm8mi000nr7irgozz5fzv	Kimchi	Fermented Foods	{MICROBIOME,IMMUNITY}	{Probiotics,"Vitamin K2",Fiber}	\N	{"IMMUNITY": "HIGH", "MICROBIOME": "HIGH"}	2026-01-10 21:04:13.098	2026-01-10 21:04:13.098
cmk8sm8ml000or7ir34081c1i	Sauerkraut	Fermented Foods	{MICROBIOME,IMMUNITY}	{Probiotics,"Vitamin C",Fiber}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "HIGH"}	2026-01-10 21:04:13.101	2026-01-10 21:04:13.101
cmk8sm8mp000pr7ir54xk07sm	Yogurt	Dairy	{MICROBIOME,IMMUNITY}	{Probiotics,Calcium,Protein}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "HIGH"}	2026-01-10 21:04:13.105	2026-01-10 21:04:13.105
cmk8sm8ms000qr7irg2amchl8	Kefir	Dairy	{MICROBIOME,IMMUNITY}	{Probiotics,Calcium,Protein}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "HIGH"}	2026-01-10 21:04:13.108	2026-01-10 21:04:13.108
cmk8sm8mv000rr7ir783crw6i	Chickpeas	Legumes	{ANGIOGENESIS,MICROBIOME,IMMUNITY}	{Fiber,Protein,Folate}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "HIGH", "ANGIOGENESIS": "MEDIUM"}	2026-01-10 21:04:13.111	2026-01-10 21:04:13.111
cmk8sm8my000sr7irymk75g7y	Lentils	Legumes	{ANGIOGENESIS,MICROBIOME,DNA_PROTECTION,IMMUNITY}	{Fiber,Protein,Folate,Iron}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "HIGH", "ANGIOGENESIS": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.115	2026-01-10 21:04:13.115
cmk8sm8n1000tr7iri6bogz9q	Black Beans	Legumes	{ANGIOGENESIS,MICROBIOME,DNA_PROTECTION}	{Anthocyanins,Fiber,Protein}	\N	{"MICROBIOME": "HIGH", "ANGIOGENESIS": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.118	2026-01-10 21:04:13.118
cmk8sm8n5000ur7irbwwxshm3	Green Tea	Beverages	{ANGIOGENESIS,REGENERATION,DNA_PROTECTION,IMMUNITY}	{EGCG,Catechins,L-Theanine}	\N	{"IMMUNITY": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "MEDIUM", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.122	2026-01-10 21:04:13.122
cmk8sm8n8000vr7ircfwqiu55	Black Tea	Beverages	{ANGIOGENESIS,REGENERATION,DNA_PROTECTION}	{Theaflavins,Catechins,Polyphenols}	\N	{"ANGIOGENESIS": "MEDIUM", "REGENERATION": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.125	2026-01-10 21:04:13.125
cmk8sm8nb000wr7irhmmpdgdx	Coffee	Beverages	{ANGIOGENESIS,REGENERATION,DNA_PROTECTION}	{"Chlorogenic Acid",Cafestol,Polyphenols}	\N	{"ANGIOGENESIS": "MEDIUM", "REGENERATION": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.127	2026-01-10 21:04:13.127
cmk8sm8ne000xr7irfmgh8d9q	Extra Virgin Olive Oil	Oils & Fats	{ANGIOGENESIS,REGENERATION,MICROBIOME,IMMUNITY}	{Hydroxytyrosol,"Oleic Acid",Polyphenols}	\N	{"IMMUNITY": "MEDIUM", "MICROBIOME": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "MEDIUM"}	2026-01-10 21:04:13.131	2026-01-10 21:04:13.131
cmk8sm8nh000yr7ir1pf7ftee	Dark Chocolate	Other	{ANGIOGENESIS,REGENERATION,MICROBIOME,IMMUNITY}	{Flavonoids,Epicatechin,Magnesium}	>70% cacao content recommended	{"IMMUNITY": "MEDIUM", "MICROBIOME": "MEDIUM", "ANGIOGENESIS": "HIGH", "REGENERATION": "HIGH"}	2026-01-10 21:04:13.134	2026-01-10 21:04:13.134
cmk8sm8nl000zr7ir94huytqw	Mushrooms	Vegetables	{ANGIOGENESIS,DNA_PROTECTION,IMMUNITY}	{Beta-Glucans,Ergothioneine,"Vitamin D"}	\N	{"IMMUNITY": "HIGH", "ANGIOGENESIS": "MEDIUM", "DNA_PROTECTION": "MEDIUM"}	2026-01-10 21:04:13.137	2026-01-10 21:04:13.137
cmk8sm8no0010r7irke5wng5i	Turmeric	Herbs & Spices	{REGENERATION,DNA_PROTECTION,IMMUNITY}	{Curcumin,Turmerone}	\N	{"IMMUNITY": "MEDIUM", "REGENERATION": "MEDIUM", "DNA_PROTECTION": "HIGH"}	2026-01-10 21:04:13.14	2026-01-10 21:04:13.14
\.


--
-- Data for Name: FoodItem; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."FoodItem" (id, "consumptionId", name, quantity, unit) FROM stdin;
cmkb60h310006ms6duqn1qp6o	cmkb60h300005ms6d1bbjynvt	Greek yogurt (or plant-based alternative)	1	serving
cmkb60h310008ms6dztiwi0bs	cmkb60h300005ms6d1bbjynvt	broccoli sprouts	1	serving
cmkb60h31000ams6dur545yho	cmkb60h300005ms6d1bbjynvt	fresh strawberries, sliced	1	serving
cmkb60h31000cms6d9c760qmv	cmkb60h300005ms6d1bbjynvt	fresh blueberries	1	serving
cmkb60h32000ems6ds45peywq	cmkb60h300005ms6d1bbjynvt	fresh blackberries	1	serving
cmkb60h32000gms6dng0i1n3f	cmkb60h300005ms6d1bbjynvt	kiwi, peeled and diced	1	serving
cmkb60h32000ims6d15nm01zp	cmkb60h300005ms6d1bbjynvt	guava, diced	1	serving
cmkb60h32000kms6df0aj981a	cmkb60h300005ms6d1bbjynvt	walnuts, roughly chopped	1	serving
cmkb60h32000mms6dotna4dpx	cmkb60h300005ms6d1bbjynvt	honey	1	serving
cmkb60h32000oms6dcjfcdhg6	cmkb60h300005ms6d1bbjynvt	cinnamon	1	serving
cmkb60h32000qms6dx7re5pv2	cmkb60h300005ms6d1bbjynvt	rolled oats	1	serving
cmkb60h32000sms6dq419gz8f	cmkb60h300005ms6d1bbjynvt	olive oil	1	serving
cmkb60h32000ums6drjn70n2q	cmkb60h300005ms6d1bbjynvt	brewed black tea, cooled	1	serving
cmkb60h32000wms6d19fd2t8q	cmkb60h300005ms6d1bbjynvt	pumpkin seeds	1	serving
cmkb60h32000yms6dcsa33sa4	cmkb60h300005ms6d1bbjynvt	sea salt	1	serving
cmkb60h320010ms6dm87j8az0	cmkb60h300005ms6d1bbjynvt	pomegranate arils	1	serving
cmkb60h320012ms6dmkt8ki6z	cmkb60h300005ms6d1bbjynvt	turmeric powder	1	serving
cmkb60h330014ms6d8jdcoful	cmkb60h300005ms6d1bbjynvt	lemon juice	1	serving
cmkb6b42a001gms6dizp78kyt	cmkb6b42a001fms6d0c3rlhz0	Blackberries	1	serving
cmkb6b42a001lms6duzku3vlk	cmkb6b42a001fms6d0c3rlhz0	Walnuts	1	serving
cmkb6b42a001qms6dqr6cyy3k	cmkb6b42a001fms6d0c3rlhz0	Green Tea	1	serving
cmkch9whc0006zu4dydddjiss	cmkch9whb0005zu4d0rls27l4	eggs	1	serving
cmkch9whc000azu4dzxkxsng5	cmkch9whb0005zu4d0rls27l4	unsweetened almond milk	1	serving
cmkch9whc000ezu4dusm8imar	cmkch9whb0005zu4d0rls27l4	ground turmeric	1	serving
cmkch9whc000izu4d9889mn6w	cmkch9whb0005zu4d0rls27l4	black pepper	1	serving
cmkch9whc000mzu4deox8szgk	cmkch9whb0005zu4d0rls27l4	extra virgin olive oil	1	serving
cmkch9whc000qzu4dc0xz7h7l	cmkch9whb0005zu4d0rls27l4	garlic, minced	1	serving
cmkch9whc000uzu4dcqekxer1	cmkch9whb0005zu4d0rls27l4	kale, chopped	1	serving
cmkch9whc000yzu4dmt8zaafs	cmkch9whb0005zu4d0rls27l4	carrots, julienned	1	serving
cmkch9whc0012zu4d4rb9rtao	cmkch9whb0005zu4d0rls27l4	sea salt	1	serving
cmkch9whc0016zu4dvy91p72v	cmkch9whb0005zu4d0rls27l4	blackberries	1	serving
cmkch9whc001azu4dxfuckz26	cmkch9whb0005zu4d0rls27l4	blueberries	1	serving
cmkch9whc001ezu4dmguq0s2i	cmkch9whb0005zu4d0rls27l4	walnuts, roughly chopped	1	serving
cmkch9whc001izu4dmv97tdgn	cmkch9whb0005zu4d0rls27l4	honey	1	serving
cmkch9whd001mzu4d8wuzvdw9	cmkch9whb0005zu4d0rls27l4	lemon juice	1	serving
cmkch9whd001qzu4dq5re4az9	cmkch9whb0005zu4d0rls27l4	brewed green tea, cooled	1	serving
cmkch9whd001uzu4drig0mjpd	cmkch9whb0005zu4d0rls27l4	kiwis, peeled and chopped	1	serving
cmkch9whd001yzu4d4hs0myaq	cmkch9whb0005zu4d0rls27l4	Greek yogurt	1	serving
cmkch9whd0022zu4dqv6e4d39	cmkch9whb0005zu4d0rls27l4	almonds, sliced	1	serving
cmkch9whd0026zu4dbyxld6kg	cmkch9whb0005zu4d0rls27l4	fresh chives, chopped	1	serving
cmkckzo1s00088rtjqcaksmyw	cmkckzo1r00078rtjsp80e2cc	rolled oats	1	serving
cmkckzo1s000a8rtjcy1gadm2	cmkckzo1r00078rtjsp80e2cc	plain Greek yogurt	1	serving
cmkckzo1s000c8rtj9fir323j	cmkckzo1r00078rtjsp80e2cc	kefir	1	serving
cmkckzo1s000e8rtjmpim7la2	cmkckzo1r00078rtjsp80e2cc	ground flaxseeds	1	serving
cmkckzo1s000g8rtjjzvyqstj	cmkckzo1r00078rtjsp80e2cc	raw honey	1	serving
cmkckzo1s000i8rtjpdqa60ms	cmkckzo1r00078rtjsp80e2cc	vanilla extract	1	serving
cmkckzo1s000k8rtjj74bugrp	cmkckzo1r00078rtjsp80e2cc	sea salt	1	serving
cmkckzo1s000m8rtj0pj9l2du	cmkckzo1r00078rtjsp80e2cc	fresh blackberries	1	serving
cmkckzo1s000o8rtjd4zbudb4	cmkckzo1r00078rtjsp80e2cc	bananas	1	serving
cmkckzo1s000q8rtj7kca8zhn	cmkckzo1r00078rtjsp80e2cc	coconut oil	1	serving
cmkckzo1s000s8rtjp36qcf1h	cmkckzo1r00078rtjsp80e2cc	sliced almonds	1	serving
cmkckzo1s000u8rtjg0tzgu46	cmkckzo1r00078rtjsp80e2cc	cinnamon	1	serving
cmkckzo1s000w8rtjt23az144	cmkckzo1r00078rtjsp80e2cc	apple, diced small	1	serving
cmkckzo1s000y8rtjklhu6np9	cmkckzo1r00078rtjsp80e2cc	water	1	serving
cmkckzo1t00108rtj3heptoir	cmkckzo1r00078rtjsp80e2cc	brewed black tea, cooled	1	serving
cmkckzo1t00128rtjtl4143x4	cmkckzo1r00078rtjsp80e2cc	maple syrup	1	serving
cmkcm9fts000ej399l6czqn7c	cmkcm9fts000dj3994hhz5of0	ricotta cheese	1	serving
cmkcm9fts000gj39944b1mx5k	cmkcm9fts000dj3994hhz5of0	honey	1	serving
cmkcm9fts000ij399a3gshyia	cmkcm9fts000dj3994hhz5of0	1/2 tsp ground cinnamon	1	serving
cmkcm9fts000kj399dlryxtw9	cmkcm9fts000dj3994hhz5of0	1/4 tsp vanilla extract	1	serving
cmkcm9fts000mj3991b73sgg5	cmkcm9fts000dj3994hhz5of0	apples, diced	1	serving
cmkcm9fts000oj399e49jxswd	cmkcm9fts000dj3994hhz5of0	fresh lemon juice	1	serving
cmkcm9fts000qj399me2z03c9	cmkcm9fts000dj3994hhz5of0	fresh strawberries, sliced	1	serving
cmkcm9fts000sj399lv6dsl6z	cmkcm9fts000dj3994hhz5of0	1/2 cup fresh blueberries	1	serving
cmkcm9fts000uj3993ko8jhsv	cmkcm9fts000dj3994hhz5of0	1/2 cup fresh raspberries	1	serving
cmkcm9fts000wj3998fjlaw2y	cmkcm9fts000dj3994hhz5of0	1/2 cup chopped walnuts	1	serving
cmkcm9ftt000yj399neoizqp2	cmkcm9fts000dj3994hhz5of0	unsweetened pomegranate juice	1	serving
cmkcm9ftt0010j3999tc213mx	cmkcm9fts000dj3994hhz5of0	chia seeds	1	serving
cmkcm9ftt0012j399kgbqgijl	cmkcm9fts000dj3994hhz5of0	orange zest	1	serving
cmkcm9ftt0014j399eq0qqu7g	cmkcm9fts000dj3994hhz5of0	pinch sea salt	1	serving
\.


--
-- Data for Name: GeneratedRecipe; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."GeneratedRecipe" (id, "userId", "mealId", name, description, servings, "prepTime", "cookTime", "totalTime", difficulty, ingredients, instructions, calories, protein, carbs, fat, fiber, "defenseSystems", tags, "isPublic", likes, saves, "generatedBy", "customPrompt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Meal; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Meal" (id, "dailyMenuId", "mealType", slot, "mealName", servings, "defenseSystems", "prepTime", "cookTime", "position", "customInstructions", "recipeGenerated", "recipeId", consumed, "consumedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MealPlan; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."MealPlan" (id, "userId", title, description, "weekStart", "weekEnd", "durationWeeks", "defaultServings", visibility, status, tags, likes, saves, views, "customInstructions", "dietaryRestrictions", "focusSystems", "createdAt", "updatedAt", "publishedAt") FROM stdin;
\.


--
-- Data for Name: MealPlanComment; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."MealPlanComment" (id, "userId", "mealPlanId", content, edited, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MealPlanLike; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."MealPlanLike" (id, "userId", "mealPlanId", "createdAt") FROM stdin;
\.


--
-- Data for Name: MealPlanReport; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."MealPlanReport" (id, "userId", "mealPlanId", reason, details, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PantryItem; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."PantryItem" (id, "userId", name, category, quantity, unit, "alwaysHave", "lowStockAlert", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."PasswordResetToken" (id, "userId", token, expires, used, "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Progress; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Progress" (id, "userId", date, "defenseSystem", "foodsConsumed", count, notes, "createdAt", "updatedAt", deprecated, "migratedTo") FROM stdin;
cmk8sltwi000u6lmfc9jkiikl	cmk8sltug00006lmfx0vil5us	2026-01-09	ANGIOGENESIS	["Tomatoes", "Olive Oil", "Red Wine", "Dark Chocolate"]	4	Feeling great! Tomato bruschetta was delicious.	2026-01-10 21:03:54.019	2026-01-10 21:03:54.019	f	\N
cmk8sltwl000w6lmfoeyucexv	cmk8sltug00006lmfx0vil5us	2026-01-09	MICROBIOME	["Greek Yogurt", "Kimchi", "Sauerkraut"]	3	Started my day with yogurt bowl.	2026-01-10 21:03:54.022	2026-01-10 21:03:54.022	f	\N
\.


--
-- Data for Name: Rating; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Rating" (id, value, "recipeId", "userId", "createdAt") FROM stdin;
cmk8sltvz000g6lmf8ctfhb1e	5	cmk8sltuz00046lmfvzq2xpvn	cmk8sltur00016lmf3wecitlc	2026-01-10 21:03:53.999
cmk8sltw2000i6lmfywrbwk2c	4	cmk8sltuz00046lmfvzq2xpvn	cmk8sltuv00026lmf3ui32pge	2026-01-10 21:03:54.003
cmk8sltw4000k6lmfhq5t1bl8	5	cmk8sltvi00066lmfeyldcutm	cmk8sltug00006lmfx0vil5us	2026-01-10 21:03:54.005
\.


--
-- Data for Name: Recipe; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Recipe" (id, title, description, ingredients, instructions, "prepTime", "cookTime", servings, "defenseSystems", nutrients, "imageUrl", "userId", "createdAt", "updatedAt", "ingredientSystemMap") FROM stdin;
cmk8sltvs000c6lmfxaxjvza4	Garlic Ginger Immunity Soup	Warming soup loaded with immune-boosting ingredients to fight infection.	[{"name": "Garlic cloves", "amount": "6 cloves"}, {"name": "Fresh ginger", "amount": "2 inches"}, {"name": "Shiitake mushrooms", "amount": "1 cup"}, {"name": "Chicken broth", "amount": "4 cups"}, {"name": "Onion", "amount": "1 large"}, {"name": "Carrots", "amount": "2 medium"}, {"name": "Turmeric powder", "amount": "1 tsp"}]	1. Mince garlic and grate ginger.\n2. Dice onion and slice carrots.\n3. Slice mushrooms thinly.\n4. Heat oil in large pot over medium heat.\n5. Sauté onion, garlic, and ginger for 3 minutes.\n6. Add carrots and mushrooms, cook 5 minutes.\n7. Pour in broth and add turmeric.\n8. Simmer for 20 minutes.\n9. Season with salt and pepper to taste.\n10. Serve hot with fresh herbs.	10 min	25 min	4	{IMMUNITY}	{"allicin": "High", "gingerol": "25mg", "vitamin_d": "200 IU", "beta_glucans": "450mg"}	\N	cmk8sltug00006lmfx0vil5us	2026-01-10 21:03:53.963	2026-01-10 21:03:53.963	\N
cmk8sltuz00046lmfvzq2xpvn	Tomato & Olive Oil Bruschetta	Classic Italian appetizer rich in lycopene and healthy fats that support blood vessel formation.	[{"name": "Ripe tomatoes", "amount": "4 large"}, {"name": "Extra virgin olive oil", "amount": "3 tbsp"}, {"name": "Fresh basil", "amount": "1/4 cup"}, {"name": "Garlic cloves", "amount": "2 cloves"}, {"name": "Baguette", "amount": "1 loaf"}, {"name": "Balsamic vinegar", "amount": "1 tsp"}]	1. Dice tomatoes and place in a bowl.\n2. Mince garlic and chop basil leaves.\n3. Mix tomatoes, olive oil, garlic, basil, and balsamic vinegar.\n4. Let mixture sit for 15 minutes to develop flavors.\n5. Slice baguette and toast until golden.\n6. Top each slice with tomato mixture.\n7. Drizzle with extra olive oil if desired.\n8. Serve immediately.	15 min	5 min	6	{ANGIOGENESIS}	{"lycopene": "8.2mg", "vitamin_c": "28mg", "polyphenols": "High", "healthy_fats": "14g"}	\N	cmk8sltug00006lmfx0vil5us	2026-01-10 21:03:53.963	2026-01-10 21:03:53.963	\N
cmk8sltvi00066lmfeyldcutm	Berry Yogurt Power Bowl	Probiotic-rich breakfast bowl packed with antioxidants and gut-healthy bacteria.	[{"name": "Greek yogurt", "amount": "1 cup"}, {"name": "Blueberries", "amount": "1/2 cup"}, {"name": "Strawberries", "amount": "1/2 cup"}, {"name": "Walnuts", "amount": "1/4 cup"}, {"name": "Honey", "amount": "1 tbsp"}, {"name": "Chia seeds", "amount": "1 tbsp"}]	1. Place Greek yogurt in a bowl.\n2. Wash and slice strawberries.\n3. Add blueberries and strawberries on top.\n4. Chop walnuts and sprinkle over berries.\n5. Add chia seeds for extra omega-3s.\n6. Drizzle honey over the entire bowl.\n7. Mix gently or eat layered.\n8. Enjoy immediately for best texture.	10 min	\N	1	{MICROBIOME}	{"fiber": "8g", "protein": "20g", "probiotics": "1 billion CFU", "antioxidants": "Very High"}	\N	cmk8sltur00016lmf3wecitlc	2026-01-10 21:03:53.963	2026-01-10 21:03:53.963	\N
cmk8sltvj00086lmfd6j0c2n3	Kimchi Fried Rice Bowl	Fermented food powerhouse that supports gut microbiome diversity.	[{"name": "Cooked rice", "amount": "2 cups"}, {"name": "Kimchi", "amount": "1 cup"}, {"name": "Egg", "amount": "2 large"}, {"name": "Sesame oil", "amount": "1 tbsp"}, {"name": "Green onions", "amount": "2 stalks"}, {"name": "Soy sauce", "amount": "2 tbsp"}]	1. Chop kimchi into bite-sized pieces.\n2. Heat sesame oil in large pan or wok.\n3. Add kimchi and stir-fry for 2 minutes.\n4. Add cold cooked rice, breaking up clumps.\n5. Stir-fry for 5 minutes until rice is heated.\n6. Push rice to sides, crack eggs in center.\n7. Scramble eggs, then mix with rice.\n8. Add soy sauce and sliced green onions.\n9. Stir everything together.\n10. Serve hot, optionally topped with sesame seeds.	5 min	10 min	2	{MICROBIOME}	{"fiber": "3g", "capsaicin": "Medium", "vitamin_k": "68mcg", "probiotics": "2.6 billion CFU"}	\N	cmk8sltuv00026lmf3ui32pge	2026-01-10 21:03:53.963	2026-01-10 21:03:53.963	\N
cmk8sltvr000a6lmfzyh6uvws	Green Tea Matcha Smoothie	Antioxidant powerhouse that protects DNA and promotes cellular health.	[{"name": "Matcha green tea powder", "amount": "1 tsp"}, {"name": "Fresh spinach", "amount": "1 cup"}, {"name": "Banana", "amount": "1 medium"}, {"name": "Almond milk", "amount": "1 cup"}, {"name": "Chia seeds", "amount": "1 tbsp"}, {"name": "Honey", "amount": "1 tsp"}]	1. Add almond milk to blender first.\n2. Add spinach leaves (they blend easier with liquid).\n3. Peel and break banana into chunks.\n4. Add matcha powder, chia seeds, and honey.\n5. Blend on high for 45-60 seconds until smooth.\n6. Check consistency; add more milk if too thick.\n7. Pour into glass immediately.\n8. Drink within 10 minutes for maximum nutrient retention.	5 min	\N	1	{DNA_PROTECTION}	{"egcg": "70mg", "catechins": "35mg", "vitamin_k": "145mcg", "antioxidants": "Extremely High"}	\N	cmk8sltuv00026lmf3ui32pge	2026-01-10 21:03:53.963	2026-01-10 21:03:53.963	\N
cmk8sltvs000e6lmf978nlnvl	Wild Salmon with Turmeric Rice	Omega-3 rich meal that promotes stem cell activation and tissue regeneration.	[{"name": "Wild salmon fillet", "amount": "6 oz"}, {"name": "Brown rice", "amount": "1 cup"}, {"name": "Turmeric powder", "amount": "1 tsp"}, {"name": "Olive oil", "amount": "2 tbsp"}, {"name": "Lemon", "amount": "1 whole"}, {"name": "Fresh dill", "amount": "2 tbsp"}]	1. Cook brown rice according to package directions.\n2. Add turmeric to rice while cooking.\n3. Pat salmon dry with paper towel.\n4. Season salmon with salt, pepper, and dill.\n5. Heat olive oil in pan over medium-high heat.\n6. Place salmon skin-side down, cook 4 minutes.\n7. Flip and cook another 3-4 minutes.\n8. Squeeze lemon juice over cooked salmon.\n9. Serve salmon over turmeric rice.\n10. Garnish with fresh dill and lemon wedges.	10 min	20 min	2	{REGENERATION}	{"omega_3": "2.2g", "protein": "34g", "curcumin": "200mg", "vitamin_d": "450 IU"}	\N	cmk8sltur00016lmf3wecitlc	2026-01-10 21:03:53.963	2026-01-10 21:03:53.963	\N
cmkb60e680003ms6d4nsh9gwc	Mediterranean Broccoli Sprout and Berry Breakfast Bowl with Cinnamon Walnuts and Kiwi	This vibrant breakfast bowl combines cruciferous powerhouses like broccoli sprouts with antioxidant-rich berries, creating a DNA-protecting morning meal. The sulforaphane from sprouts works synergistically with anthocyanins from berries and EGCG from black tea to repair cellular damage and support healthy aging. Topped with omega-3 rich walnuts and vitamin C-packed kiwi and guava, this Mediterranean-inspired bowl delivers comprehensive genetic protection.	[{"name": "Greek yogurt (or plant-based alternative)", "unit": "g", "quantity": "200"}, {"name": "broccoli sprouts", "unit": "g", "quantity": "60"}, {"name": "fresh strawberries, sliced", "unit": "g", "quantity": "100"}, {"name": "fresh blueberries", "unit": "g", "quantity": "80"}, {"name": "fresh blackberries", "unit": "g", "quantity": "80"}, {"name": "kiwi, peeled and diced", "unit": "piece", "quantity": "2"}, {"name": "guava, diced", "unit": "g", "quantity": "100"}, {"name": "walnuts, roughly chopped", "unit": "g", "quantity": "60"}, {"name": "honey", "unit": "ml", "quantity": "15"}, {"name": "cinnamon", "unit": "g", "quantity": "5"}, {"name": "rolled oats", "unit": "g", "quantity": "30"}, {"name": "olive oil", "unit": "ml", "quantity": "15"}, {"name": "brewed black tea, cooled", "unit": "ml", "quantity": "240"}, {"name": "pumpkin seeds", "unit": "g", "quantity": "30"}, {"name": "sea salt", "unit": "pinch", "quantity": "1"}, {"name": "pomegranate arils", "unit": "g", "quantity": "20"}, {"name": "turmeric powder", "unit": "g", "quantity": "2"}, {"name": "lemon juice", "unit": "ml", "quantity": "5"}]	1. Brew the black tea using 240 ml hot water and let it steep for 5 minutes, then cool completely in the refrigerator or with ice cubes.\n2. Preheat a small pan over medium heat and toast the walnuts with cinnamon and a pinch of sea salt for 3-4 minutes until fragrant, stirring frequently. Set aside to cool.\n3. In a separate pan, lightly toast the rolled oats and pumpkin seeds with olive oil for 3-4 minutes until golden. Remove from heat.\n4. In a mixing bowl, combine Greek yogurt with turmeric powder, honey, and lemon juice, stirring until smooth and evenly colored.\n5. Divide the yogurt mixture between two serving bowls as the base layer.\n6. Arrange the broccoli sprouts on one side of each bowl, keeping them fresh and crisp.\n7. Add the strawberries, blueberries, and blackberries in separate sections around the bowl for visual appeal.\n8. Place the diced kiwi and guava pieces on top of the yogurt.\n9. Sprinkle the toasted oats, cinnamon walnuts, and pumpkin seeds over the entire bowl.\n10. Garnish with pomegranate arils for extra antioxidant power and visual beauty.\n11. Serve immediately with the cooled black tea on the side for optimal DNA protection benefits.\n	15 min	8 min	2	{DNA_PROTECTION}	{"EGCG": "180 mg (from black tea)", "Zinc": "3 mg (from pumpkin seeds and yogurt)", "Folate": "125 mcg (from broccoli sprouts and berries)", "Curcumin": "40 mg (from turmeric)", "Selenium": "12 mcg (from walnuts and oats)", "Quercetin": "35 mg (from berries and tea)", "Vitamin C": "285 mg (from kiwi, guava, strawberries, and broccoli sprouts)", "Vitamin E": "8 mg (from walnuts and pumpkin seeds)", "Polyphenols": "580 mg (combined from tea, berries, and cinnamon)", "Resveratrol": "15 mg (from berries)", "Anthocyanins": "420 mg (from berries)", "Sulforaphane": "73 mg (from broccoli sprouts)", "Beta-Carotene": "850 mcg (from guava)", "Omega-3 fatty acids": "2.5 g (from walnuts)"}	\N	cmk8sltur00016lmf3wecitlc	2026-01-12 12:54:40.833	2026-01-12 12:54:40.833	\N
cmkch9u5s0003zu4d3jw93teg	Mediterranean Breakfast Bowl with Walnut-Berry Compote and Turmeric Scrambled Eggs	This vibrant Mediterranean breakfast combines omega-3 rich walnuts with antioxidant-packed blackberries and blueberries to support cellular regeneration. Turmeric-spiced eggs nest on a bed of sautéed garlic-infused kale and carrots, providing DNA-protecting sulforaphane and beta-carotene while boosting immunity with allicin. A refreshing green tea and kiwi smoothie alongside delivers powerful EGCG and vitamin C to complete this multi-system defense meal.	[{"name": "eggs", "unit": "whole", "quantity": "4"}, {"name": "unsweetened almond milk", "unit": "ml", "quantity": "60"}, {"name": "ground turmeric", "unit": "g", "quantity": "3"}, {"name": "black pepper", "unit": "pinch", "quantity": "1"}, {"name": "extra virgin olive oil", "unit": "ml", "quantity": "15"}, {"name": "garlic, minced", "unit": "clove", "quantity": "3"}, {"name": "kale, chopped", "unit": "g", "quantity": "150"}, {"name": "carrots, julienned", "unit": "g", "quantity": "100"}, {"name": "sea salt", "unit": "g", "quantity": "2"}, {"name": "blackberries", "unit": "g", "quantity": "100"}, {"name": "blueberries", "unit": "g", "quantity": "80"}, {"name": "walnuts, roughly chopped", "unit": "g", "quantity": "40"}, {"name": "honey", "unit": "ml", "quantity": "15"}, {"name": "lemon juice", "unit": "ml", "quantity": "5"}, {"name": "brewed green tea, cooled", "unit": "ml", "quantity": "250"}, {"name": "kiwis, peeled and chopped", "unit": "whole", "quantity": "2"}, {"name": "Greek yogurt", "unit": "g", "quantity": "80"}, {"name": "almonds, sliced", "unit": "g", "quantity": "30"}, {"name": "fresh chives, chopped", "unit": "g", "quantity": "5"}]	1. Brew green tea and let it cool. Blend cooled tea with chopped kiwi and 40 g Greek yogurt until smooth. Set aside in refrigerator.\n2. In a small saucepan, combine blackberries, blueberries, 30 g walnuts, honey, and lemon juice. Cook over medium heat for 5-7 minutes, stirring occasionally, until berries break down and mixture thickens. Remove from heat.\n3. In a bowl, whisk together eggs, almond milk, turmeric, black pepper, and 1 g sea salt until well combined and slightly frothy.\n4. Heat 10 ml olive oil in a large skillet over medium heat. Add minced garlic and sauté for 30 seconds until fragrant.\n5. Add julienned carrots to the skillet and cook for 2-3 minutes until slightly softened. Add chopped kale and remaining 1 g sea salt, cooking for another 2-3 minutes until kale wilts.\n6. Push vegetables to the sides of the skillet. Add remaining 5 ml olive oil to the center and pour in egg mixture. Gently scramble eggs, cooking for 2-3 minutes until just set but still creamy.\n7. Divide the vegetable and egg mixture between two bowls. Top each with warm berry-walnut compote, remaining 10 g walnuts, sliced almonds, and fresh chives.\n8. Serve immediately with the green tea-kiwi smoothie on the side, topped with remaining 40 g Greek yogurt.\n	15 min	15 min	2	{DNA_PROTECTION,IMMUNITY,REGENERATION}	{"EGCG": "125 mg", "Zinc": "3.2 mg", "Folate": "145 mcg", "Allicin": "15 mg", "Curcumin": "180 mg", "Selenium": "42 mcg", "Quercetin": "28 mg", "Vitamin A": "5600 IU", "Vitamin C": "185 mg", "Vitamin E": "8 mg", "Polyphenols": "850 mg", "Resveratrol": "12 mg", "Anthocyanins": "320 mg", "Sulforaphane": "45 mg", "Beta-Carotene": "4200 mcg", "Omega-3 Fatty Acids (ALA)": "2800 mg"}	\N	cmk8sltur00016lmf3wecitlc	2026-01-13 10:57:43.408	2026-01-13 10:57:43.408	\N
cmkckzky700058rtj1qn12ucn	Overnight Oats with Blackberry Compote, Caramelized Bananas, and Almond Crunch	This Mediterranean-inspired breakfast combines prebiotic-rich oats and bananas with probiotic Greek yogurt to nourish your gut microbiome. The blackberry compote provides polyphenols while flaxseeds deliver omega-3 fatty acids and fiber, creating a delicious morning meal that supports beneficial bacteria growth and digestive wellness.	[{"name": "rolled oats", "unit": "cup", "quantity": "1"}, {"name": "plain Greek yogurt", "unit": "cup", "quantity": "1"}, {"name": "kefir", "unit": "cup", "quantity": "1"}, {"name": "ground flaxseeds", "unit": "tbsp", "quantity": "2"}, {"name": "raw honey", "unit": "tbsp", "quantity": "1"}, {"name": "vanilla extract", "unit": "tsp", "quantity": "1"}, {"name": "sea salt", "unit": "pinch", "quantity": "1"}, {"name": "fresh blackberries", "unit": "cup", "quantity": "1"}, {"name": "bananas", "unit": "whole", "quantity": "2"}, {"name": "coconut oil", "unit": "tbsp", "quantity": "1"}, {"name": "sliced almonds", "unit": "tbsp", "quantity": "3"}, {"name": "cinnamon", "unit": "tsp", "quantity": "1"}, {"name": "apple, diced small", "unit": "whole", "quantity": "1"}, {"name": "water", "unit": "tbsp", "quantity": "2"}, {"name": "brewed black tea, cooled", "unit": "cup", "quantity": "1"}, {"name": "maple syrup", "unit": "tbsp", "quantity": "1"}]	1. In a large mixing bowl, combine rolled oats, Greek yogurt, kefir, ground flaxseeds, honey, vanilla extract, and sea salt. Stir until well incorporated.\n2. Add half of the cooled black tea to the oat mixture and stir to achieve desired consistency. Divide mixture between two mason jars or containers, cover, and refrigerate overnight (or minimum 4 hours).\n3. In the morning, prepare the blackberry compote by combining blackberries, water, and maple syrup in a small saucepan over medium heat. Cook for 5-7 minutes, stirring occasionally and gently mashing berries, until thickened. Set aside to cool.\n4. Heat a skillet over medium heat and toast sliced almonds for 2-3 minutes until golden and fragrant. Transfer to a small bowl and set aside.\n5. In the same skillet, melt coconut oil over medium heat. Slice bananas lengthwise and place cut-side down in the pan. Sprinkle with cinnamon and cook for 2-3 minutes until caramelized. Flip and cook another 1-2 minutes.\n6. Remove overnight oats from refrigerator and stir in the diced apple pieces.\n7. Top each serving with caramelized banana halves, a generous spoonful of blackberry compote, and toasted almonds.\n8. Drizzle with remaining black tea if desired for added moisture and antioxidants. Serve immediately.\n	15 min (plus overnight soaking)	10 min	2	{MICROBIOME}	{"Protein": "18 grams per serving", "Prebiotics": "4 grams (inulin and resistant starch from oats and bananas)", "Probiotics": "15 billion CFU from Greek yogurt and kefir (Lactobacillus and Bifidobacterium strains)", "Vitamin K2": "1.2 mcg from fermented dairy", "Polyphenols": "450 mg from blackberries, apples, and black tea", "Dietary Fiber": "12 grams per serving (soluble and insoluble)", "Omega-3 Fatty Acids": "2.5 grams from flaxseeds", "Short-Chain Fatty Acids": "Supports butyrate production through fermentable fiber"}	\N	cmk8sltur00016lmf3wecitlc	2026-01-13 12:41:43.375	2026-01-13 12:41:43.375	\N
cmkcm9d32000bj399v80q6uye	Berry-Walnut Breakfast Parfait with Honey-Cinnamon Ricotta and Apple Compote	This vibrant Mediterranean-inspired breakfast parfait layers antioxidant-rich berries with creamy ricotta cheese and omega-3 packed walnuts to support healthy blood vessel formation. The combination of strawberries, apples, and mixed berries delivers powerful anthocyanins and quercetin that help regulate angiogenesis, while walnuts provide essential omega-3 fatty acids for optimal circulation.	[{"name": "ricotta cheese", "unit": "cup", "quantity": "1"}, {"name": "honey", "unit": "tbsp", "quantity": "2"}, {"name": "1/2 tsp ground cinnamon", "unit": "as needed", "quantity": "1"}, {"name": "1/4 tsp vanilla extract", "unit": "as needed", "quantity": "1"}, {"name": "apples, diced", "unit": "medium", "quantity": "2"}, {"name": "fresh lemon juice", "unit": "tbsp", "quantity": "1"}, {"name": "fresh strawberries, sliced", "unit": "cup", "quantity": "1"}, {"name": "1/2 cup fresh blueberries", "unit": "as needed", "quantity": "1"}, {"name": "1/2 cup fresh raspberries", "unit": "as needed", "quantity": "1"}, {"name": "1/2 cup chopped walnuts", "unit": "as needed", "quantity": "1"}, {"name": "unsweetened pomegranate juice", "unit": "tbsp", "quantity": "2"}, {"name": "chia seeds", "unit": "tbsp", "quantity": "1"}, {"name": "orange zest", "unit": "tsp", "quantity": "2"}, {"name": "pinch sea salt", "unit": "as needed", "quantity": "1"}]	1. In a small saucepan over medium heat, combine diced apples, lemon juice, and 1 tablespoon honey. Cook for 8-10 minutes, stirring occasionally, until apples soften and create a light compote. Remove from heat and let cool slightly.\n2. In a medium bowl, mix ricotta cheese with remaining 1 tablespoon honey, cinnamon, vanilla extract, and orange zest until smooth and creamy.\n3. In a separate bowl, gently toss strawberries, blueberries, and raspberries with pomegranate juice.\n4. Toast walnuts in a dry skillet over medium heat for 3-4 minutes until fragrant, watching carefully to prevent burning.\n5. To assemble parfaits, layer ingredients in two serving glasses or bowls: Start with 1/4 of the honey-cinnamon ricotta, then add 1/4 of the apple compote, followed by 1/4 of the mixed berries, and 1/4 of the toasted walnuts. Repeat layers once more.\n6. Sprinkle chia seeds on top of each parfait for added texture and nutrition.\n7. Serve immediately or refrigerate for up to 2 hours before serving for a chilled breakfast option.\n	15 min	10 min	2	{ANGIOGENESIS}	{"Fiber": "12 g (from fruits, nuts, seeds)", "Calcium": "280 mg (from ricotta cheese)", "Protein": "18 g (from ricotta cheese, walnuts)", "Quercetin": "25 mg (from apples, berries)", "Vitamin C": "95 mg (from citrus zest, berries)", "Polyphenols": "320 mg (from mixed berries, apples, walnuts)", "Resveratrol": "8 mg (from red berries)", "Anthocyanins": "180 mg (from strawberries, blueberries, raspberries)", "Ellagic Acid": "45 mg (from strawberries, raspberries, pomegranate)", "Omega-3 Fatty Acids": "2.5 g (from walnuts, chia seeds)"}	\N	cmk8sltur00016lmf3wecitlc	2026-01-13 13:17:19.358	2026-01-13 13:17:19.358	\N
\.


--
-- Data for Name: Recommendation; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Recommendation" (id, "userId", type, priority, status, title, description, reasoning, "actionLabel", "actionUrl", "actionData", "targetSystem", "targetMealTime", "expiresAt", "createdAt", "acceptedAt", "dismissedAt", "actedAt", "shoppedAt", "completedAt", "linkedRecipeId", "linkedShoppingListId", "linkedMealLogId", "viewCount", "dismissCount") FROM stdin;
cmkbf6i620005g6up3uom3m9h	cmk8sltur00016lmf3wecitlc	RECIPE	MEDIUM	COMPLETED	Strengthen Your ANGIOGENESIS (3/5 foods)	You've logged 3 angiogenesis foods. Add 2 more to complete this system!	Weak defense system detected. Only 3/5 angiogenesis foods logged today.	Generate Recipe	/recipes/ai-generate	{"targetSystem": "ANGIOGENESIS", "preferredMealTime": "LUNCH", "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	ANGIOGENESIS	\N	2026-01-15 12:00:00	2026-01-12 17:11:22.49	\N	\N	2026-01-13 13:17:20.78	\N	2026-01-13 13:17:22.947	cmkcm9d32000bj399v80q6uye	\N	cmkcm9fts000dj3994hhz5of0	1	0
cmkbf6i660009g6upg6876ckk	cmk8sltur00016lmf3wecitlc	RECIPE	MEDIUM	COMPLETED	Strengthen Your MICROBIOME (1/5 foods)	You've logged 1 microbiome food. Add 4 more to complete this system!	Weak defense system detected. Only 1/5 microbiome foods logged today.	Generate Recipe	/recipes/ai-generate	{"targetSystem": "MICROBIOME", "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	MICROBIOME	\N	2026-01-15 12:00:00	2026-01-12 17:11:22.494	\N	\N	2026-01-13 12:41:44.653	\N	2026-01-13 12:41:47.422	cmkckzky700058rtj1qn12ucn	\N	cmkckzo1r00078rtjsp80e2cc	106	0
cmkbf6i650007g6upxi4qr6hr	cmk8sltur00016lmf3wecitlc	RECIPE	MEDIUM	DISMISSED	Strengthen Your REGENERATION (3/5 foods)	You've logged 3 regeneration foods. Add 2 more to complete this system!	Weak defense system detected. Only 3/5 regeneration foods logged today.	Generate Recipe	/recipes/ai-generate	{"targetSystem": "REGENERATION", "preferredMealTime": "LUNCH", "dietaryRestrictions": ["Mediterranean", "Vegetarian"]}	REGENERATION	\N	2026-01-15 12:00:00	2026-01-12 17:11:22.492	\N	2026-01-13 13:46:20.365	\N	\N	\N	\N	\N	\N	47	0
\.


--
-- Data for Name: SavedMealPlan; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."SavedMealPlan" (id, "userId", "mealPlanId", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: ShoppingList; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."ShoppingList" (id, "userId", "mealPlanId", title, items, "totalItems", "totalCost", currency, "pantryFiltered", "lastExported", "sourceType", "sourceIds", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."User" (id, name, email, "emailVerified", password, image, bio, "createdAt", "updatedAt", "aiQuestionsThisMonth", anonymized, country, "defaultDietaryRestrictions", "defaultFocusSystems", "defaultServings", "imageGenerationsThisMonth", language, "lastLoginAt", "lastResetDate", "mealPlansThisMonth", "measurementSystem", "notificationPreferences", "pdfExportsThisMonth", "privacyAccepted", "privacyAcceptedAt", "recipeGenerationsThisMonth", role, "stripeCustomerId", "stripeSubscriptionId", "subscriptionEndsAt", "subscriptionStatus", "subscriptionTier", "termsAccepted", "termsAcceptedAt", theme, timezone, "trialEndsAt") FROM stdin;
cmk8sltug00006lmfx0vil5us	Sarah Martinez	sarah@example.com	\N	$2a$10$2GMreInWdxRpddXiFKRNDeEFlewTU9LnEy3i35LrDLWeTcNbwiEcq	\N	Health enthusiast and recipe creator. Passionate about the 5x5x5 system!	2026-01-10 21:03:53.944	2026-01-13 11:36:39.192	0	f	\N	{}	{}	2	0	en	\N	2026-01-10 21:03:53.944	1	imperial	\N	0	f	\N	0	USER	\N	\N	\N	active	FREE	f	\N	light	UTC	\N
cmk8sltuv00026lmf3ui32pge	Emma Lee	emma@example.com	\N	$2a$10$2GMreInWdxRpddXiFKRNDeEFlewTU9LnEy3i35LrDLWeTcNbwiEcq	\N	Home cook exploring the power of food as medicine.	2026-01-10 21:03:53.959	2026-01-13 11:36:39.192	0	f	\N	{}	{}	2	0	en	\N	2026-01-10 21:03:53.959	0	imperial	\N	0	f	\N	0	USER	\N	\N	2027-01-10 21:03:53.958	active	FAMILY	f	\N	light	UTC	\N
cmk8sltur00016lmf3wecitlc	John Davis	john@example.com	\N	$2a$10$2GMreInWdxRpddXiFKRNDeEFlewTU9LnEy3i35LrDLWeTcNbwiEcq	\N	Nutrition coach helping people eat to beat disease.	2026-01-10 21:03:53.956	2026-01-13 13:17:16.994	0	f	\N	{Mediterranean,Vegetarian}	{DNA_PROTECTION,IMMUNITY}	2	0	en	\N	2026-01-10 21:03:53.956	0	imperial	\N	0	f	\N	5	USER	\N	\N	2027-01-10 21:03:53.954	active	PREMIUM	f	\N	light	UTC	\N
\.


--
-- Data for Name: UserConsent; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."UserConsent" (id, "userId", necessary, analytics, marketing, "consentDate", "ipAddress", "userAgent", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserWorkflowState; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."UserWorkflowState" (id, "userId", "currentStep", "hasCreatedRecipe", "hasCreatedMealPlan", "hasShoppingList", "hasLoggedFood", "lastRecipeCreated", "lastMealPlanCreated", "lastShoppingListUsed", "lastFoodLogged", "activeRecipeId", "activeMealPlanId", "activeShoppingListId", "recipesToShoppingList", "shoppingListToLogged", "completedWorkflows", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: wellness_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ffae58b0-3a5e-407e-bf4c-234373c4cb8f	faafc5ce22e23ddcaad253cf6810e930f0f4eecbb2ccc4800c8ab83c7d2a328c	2026-01-10 16:51:58.073755+01	20251024134048_add_multiple_defense_systems	\N	\N	2026-01-10 16:51:57.931006+01	1
161939e7-7acb-46fd-84b1-0f9909dba2dd	9f98cc21320520d63dfe8ad772d051038a65149973bd7ef1b791fb1e0a941970	\N	20251229144826_add_slot_to_meal	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251229144826_add_slot_to_meal\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "Meal" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"Meal\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251229144826_add_slot_to_meal"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20251229144826_add_slot_to_meal"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	\N	2026-01-10 16:51:58.075695+01	0
\.


--
-- Name: AIGenerationLog AIGenerationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."AIGenerationLog"
    ADD CONSTRAINT "AIGenerationLog_pkey" PRIMARY KEY (id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: DailyMenu DailyMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."DailyMenu"
    ADD CONSTRAINT "DailyMenu_pkey" PRIMARY KEY (id);


--
-- Name: DailyProgressScore DailyProgressScore_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."DailyProgressScore"
    ADD CONSTRAINT "DailyProgressScore_pkey" PRIMARY KEY (id);


--
-- Name: DefenseSystemBenefit DefenseSystemBenefit_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."DefenseSystemBenefit"
    ADD CONSTRAINT "DefenseSystemBenefit_pkey" PRIMARY KEY (id);


--
-- Name: DeletionLog DeletionLog_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."DeletionLog"
    ADD CONSTRAINT "DeletionLog_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY (id);


--
-- Name: FeatureFlag FeatureFlag_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FeatureFlag"
    ADD CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY (id);


--
-- Name: FoodConsumption FoodConsumption_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodConsumption"
    ADD CONSTRAINT "FoodConsumption_pkey" PRIMARY KEY (id);


--
-- Name: FoodDatabase FoodDatabase_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodDatabase"
    ADD CONSTRAINT "FoodDatabase_pkey" PRIMARY KEY (id);


--
-- Name: FoodItem FoodItem_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodItem"
    ADD CONSTRAINT "FoodItem_pkey" PRIMARY KEY (id);


--
-- Name: GeneratedRecipe GeneratedRecipe_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."GeneratedRecipe"
    ADD CONSTRAINT "GeneratedRecipe_pkey" PRIMARY KEY (id);


--
-- Name: MealPlanComment MealPlanComment_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanComment"
    ADD CONSTRAINT "MealPlanComment_pkey" PRIMARY KEY (id);


--
-- Name: MealPlanLike MealPlanLike_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanLike"
    ADD CONSTRAINT "MealPlanLike_pkey" PRIMARY KEY (id);


--
-- Name: MealPlanReport MealPlanReport_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanReport"
    ADD CONSTRAINT "MealPlanReport_pkey" PRIMARY KEY (id);


--
-- Name: MealPlan MealPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlan"
    ADD CONSTRAINT "MealPlan_pkey" PRIMARY KEY (id);


--
-- Name: Meal Meal_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Meal"
    ADD CONSTRAINT "Meal_pkey" PRIMARY KEY (id);


--
-- Name: PantryItem PantryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."PantryItem"
    ADD CONSTRAINT "PantryItem_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: Progress Progress_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Progress"
    ADD CONSTRAINT "Progress_pkey" PRIMARY KEY (id);


--
-- Name: Rating Rating_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Rating_pkey" PRIMARY KEY (id);


--
-- Name: Recipe Recipe_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT "Recipe_pkey" PRIMARY KEY (id);


--
-- Name: Recommendation Recommendation_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Recommendation"
    ADD CONSTRAINT "Recommendation_pkey" PRIMARY KEY (id);


--
-- Name: SavedMealPlan SavedMealPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."SavedMealPlan"
    ADD CONSTRAINT "SavedMealPlan_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: ShoppingList ShoppingList_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."ShoppingList"
    ADD CONSTRAINT "ShoppingList_pkey" PRIMARY KEY (id);


--
-- Name: UserConsent UserConsent_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."UserConsent"
    ADD CONSTRAINT "UserConsent_pkey" PRIMARY KEY (id);


--
-- Name: UserWorkflowState UserWorkflowState_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."UserWorkflowState"
    ADD CONSTRAINT "UserWorkflowState_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AIGenerationLog_createdAt_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "AIGenerationLog_createdAt_idx" ON public."AIGenerationLog" USING btree ("createdAt");


--
-- Name: AIGenerationLog_generationType_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "AIGenerationLog_generationType_idx" ON public."AIGenerationLog" USING btree ("generationType");


--
-- Name: AIGenerationLog_success_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "AIGenerationLog_success_idx" ON public."AIGenerationLog" USING btree (success);


--
-- Name: AIGenerationLog_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "AIGenerationLog_userId_idx" ON public."AIGenerationLog" USING btree ("userId");


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Comment_recipeId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Comment_recipeId_idx" ON public."Comment" USING btree ("recipeId");


--
-- Name: Comment_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Comment_userId_idx" ON public."Comment" USING btree ("userId");


--
-- Name: DailyMenu_mealPlanId_date_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "DailyMenu_mealPlanId_date_idx" ON public."DailyMenu" USING btree ("mealPlanId", date);


--
-- Name: DailyMenu_mealPlanId_date_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "DailyMenu_mealPlanId_date_key" ON public."DailyMenu" USING btree ("mealPlanId", date);


--
-- Name: DailyProgressScore_date_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "DailyProgressScore_date_idx" ON public."DailyProgressScore" USING btree (date);


--
-- Name: DailyProgressScore_userId_date_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "DailyProgressScore_userId_date_idx" ON public."DailyProgressScore" USING btree ("userId", date);


--
-- Name: DailyProgressScore_userId_date_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "DailyProgressScore_userId_date_key" ON public."DailyProgressScore" USING btree ("userId", date);


--
-- Name: DefenseSystemBenefit_defenseSystem_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "DefenseSystemBenefit_defenseSystem_idx" ON public."DefenseSystemBenefit" USING btree ("defenseSystem");


--
-- Name: DefenseSystemBenefit_foodItemId_defenseSystem_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "DefenseSystemBenefit_foodItemId_defenseSystem_key" ON public."DefenseSystemBenefit" USING btree ("foodItemId", "defenseSystem");


--
-- Name: DeletionLog_deletedAt_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "DeletionLog_deletedAt_idx" ON public."DeletionLog" USING btree ("deletedAt");


--
-- Name: Favorite_recipeId_userId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "Favorite_recipeId_userId_key" ON public."Favorite" USING btree ("recipeId", "userId");


--
-- Name: Favorite_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Favorite_userId_idx" ON public."Favorite" USING btree ("userId");


--
-- Name: FeatureFlag_name_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "FeatureFlag_name_key" ON public."FeatureFlag" USING btree (name);


--
-- Name: FoodConsumption_mealId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodConsumption_mealId_idx" ON public."FoodConsumption" USING btree ("mealId");


--
-- Name: FoodConsumption_recipeId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodConsumption_recipeId_idx" ON public."FoodConsumption" USING btree ("recipeId");


--
-- Name: FoodConsumption_sourceType_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodConsumption_sourceType_idx" ON public."FoodConsumption" USING btree ("sourceType");


--
-- Name: FoodConsumption_userId_date_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodConsumption_userId_date_idx" ON public."FoodConsumption" USING btree ("userId", date);


--
-- Name: FoodConsumption_userId_date_mealTime_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodConsumption_userId_date_mealTime_idx" ON public."FoodConsumption" USING btree ("userId", date, "mealTime");


--
-- Name: FoodDatabase_category_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodDatabase_category_idx" ON public."FoodDatabase" USING btree (category);


--
-- Name: FoodDatabase_name_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodDatabase_name_idx" ON public."FoodDatabase" USING btree (name);


--
-- Name: FoodDatabase_name_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "FoodDatabase_name_key" ON public."FoodDatabase" USING btree (name);


--
-- Name: FoodItem_consumptionId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodItem_consumptionId_idx" ON public."FoodItem" USING btree ("consumptionId");


--
-- Name: FoodItem_name_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "FoodItem_name_idx" ON public."FoodItem" USING btree (name);


--
-- Name: GeneratedRecipe_isPublic_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "GeneratedRecipe_isPublic_idx" ON public."GeneratedRecipe" USING btree ("isPublic");


--
-- Name: GeneratedRecipe_mealId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "GeneratedRecipe_mealId_key" ON public."GeneratedRecipe" USING btree ("mealId");


--
-- Name: GeneratedRecipe_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "GeneratedRecipe_userId_idx" ON public."GeneratedRecipe" USING btree ("userId");


--
-- Name: MealPlanComment_mealPlanId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "MealPlanComment_mealPlanId_idx" ON public."MealPlanComment" USING btree ("mealPlanId");


--
-- Name: MealPlanLike_mealPlanId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "MealPlanLike_mealPlanId_idx" ON public."MealPlanLike" USING btree ("mealPlanId");


--
-- Name: MealPlanLike_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "MealPlanLike_userId_idx" ON public."MealPlanLike" USING btree ("userId");


--
-- Name: MealPlanLike_userId_mealPlanId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "MealPlanLike_userId_mealPlanId_key" ON public."MealPlanLike" USING btree ("userId", "mealPlanId");


--
-- Name: MealPlanReport_status_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "MealPlanReport_status_idx" ON public."MealPlanReport" USING btree (status);


--
-- Name: MealPlan_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "MealPlan_userId_idx" ON public."MealPlan" USING btree ("userId");


--
-- Name: MealPlan_visibility_status_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "MealPlan_visibility_status_idx" ON public."MealPlan" USING btree (visibility, status);


--
-- Name: MealPlan_weekStart_weekEnd_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "MealPlan_weekStart_weekEnd_idx" ON public."MealPlan" USING btree ("weekStart", "weekEnd");


--
-- Name: Meal_consumed_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Meal_consumed_idx" ON public."Meal" USING btree (consumed);


--
-- Name: Meal_dailyMenuId_mealType_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Meal_dailyMenuId_mealType_idx" ON public."Meal" USING btree ("dailyMenuId", "mealType");


--
-- Name: Meal_recipeId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "Meal_recipeId_key" ON public."Meal" USING btree ("recipeId");


--
-- Name: PantryItem_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "PantryItem_userId_idx" ON public."PantryItem" USING btree ("userId");


--
-- Name: PantryItem_userId_name_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "PantryItem_userId_name_key" ON public."PantryItem" USING btree ("userId", name);


--
-- Name: PasswordResetToken_expires_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "PasswordResetToken_expires_idx" ON public."PasswordResetToken" USING btree (expires);


--
-- Name: PasswordResetToken_token_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "PasswordResetToken_token_idx" ON public."PasswordResetToken" USING btree (token);


--
-- Name: PasswordResetToken_token_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON public."PasswordResetToken" USING btree (token);


--
-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "PasswordResetToken_userId_idx" ON public."PasswordResetToken" USING btree ("userId");


--
-- Name: Progress_deprecated_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Progress_deprecated_idx" ON public."Progress" USING btree (deprecated);


--
-- Name: Progress_userId_date_defenseSystem_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "Progress_userId_date_defenseSystem_key" ON public."Progress" USING btree ("userId", date, "defenseSystem");


--
-- Name: Progress_userId_date_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Progress_userId_date_idx" ON public."Progress" USING btree ("userId", date);


--
-- Name: Rating_recipeId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Rating_recipeId_idx" ON public."Rating" USING btree ("recipeId");


--
-- Name: Rating_recipeId_userId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "Rating_recipeId_userId_key" ON public."Rating" USING btree ("recipeId", "userId");


--
-- Name: Recipe_createdAt_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Recipe_createdAt_idx" ON public."Recipe" USING btree ("createdAt");


--
-- Name: Recipe_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Recipe_userId_idx" ON public."Recipe" USING btree ("userId");


--
-- Name: Recommendation_priority_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Recommendation_priority_idx" ON public."Recommendation" USING btree (priority);


--
-- Name: Recommendation_type_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Recommendation_type_idx" ON public."Recommendation" USING btree (type);


--
-- Name: Recommendation_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Recommendation_userId_createdAt_idx" ON public."Recommendation" USING btree ("userId", "createdAt");


--
-- Name: Recommendation_userId_status_expiresAt_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "Recommendation_userId_status_expiresAt_idx" ON public."Recommendation" USING btree ("userId", status, "expiresAt");


--
-- Name: SavedMealPlan_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "SavedMealPlan_userId_idx" ON public."SavedMealPlan" USING btree ("userId");


--
-- Name: SavedMealPlan_userId_mealPlanId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "SavedMealPlan_userId_mealPlanId_key" ON public."SavedMealPlan" USING btree ("userId", "mealPlanId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: ShoppingList_mealPlanId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "ShoppingList_mealPlanId_idx" ON public."ShoppingList" USING btree ("mealPlanId");


--
-- Name: ShoppingList_userId_idx; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE INDEX "ShoppingList_userId_idx" ON public."ShoppingList" USING btree ("userId");


--
-- Name: UserConsent_userId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "UserConsent_userId_key" ON public."UserConsent" USING btree ("userId");


--
-- Name: UserWorkflowState_userId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "UserWorkflowState_userId_key" ON public."UserWorkflowState" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON public."User" USING btree ("stripeCustomerId");


--
-- Name: User_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON public."User" USING btree ("stripeSubscriptionId");


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: wellness_user
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: AIGenerationLog AIGenerationLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."AIGenerationLog"
    ADD CONSTRAINT "AIGenerationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DailyMenu DailyMenu_mealPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."DailyMenu"
    ADD CONSTRAINT "DailyMenu_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES public."MealPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DailyProgressScore DailyProgressScore_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."DailyProgressScore"
    ADD CONSTRAINT "DailyProgressScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DefenseSystemBenefit DefenseSystemBenefit_foodItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."DefenseSystemBenefit"
    ADD CONSTRAINT "DefenseSystemBenefit_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES public."FoodItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FoodConsumption FoodConsumption_mealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodConsumption"
    ADD CONSTRAINT "FoodConsumption_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES public."Meal"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FoodConsumption FoodConsumption_mealPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodConsumption"
    ADD CONSTRAINT "FoodConsumption_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES public."MealPlan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FoodConsumption FoodConsumption_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodConsumption"
    ADD CONSTRAINT "FoodConsumption_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FoodConsumption FoodConsumption_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodConsumption"
    ADD CONSTRAINT "FoodConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FoodItem FoodItem_consumptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."FoodItem"
    ADD CONSTRAINT "FoodItem_consumptionId_fkey" FOREIGN KEY ("consumptionId") REFERENCES public."FoodConsumption"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GeneratedRecipe GeneratedRecipe_mealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."GeneratedRecipe"
    ADD CONSTRAINT "GeneratedRecipe_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES public."Meal"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GeneratedRecipe GeneratedRecipe_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."GeneratedRecipe"
    ADD CONSTRAINT "GeneratedRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MealPlanComment MealPlanComment_mealPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanComment"
    ADD CONSTRAINT "MealPlanComment_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES public."MealPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MealPlanComment MealPlanComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanComment"
    ADD CONSTRAINT "MealPlanComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MealPlanLike MealPlanLike_mealPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanLike"
    ADD CONSTRAINT "MealPlanLike_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES public."MealPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MealPlanLike MealPlanLike_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanLike"
    ADD CONSTRAINT "MealPlanLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MealPlanReport MealPlanReport_mealPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanReport"
    ADD CONSTRAINT "MealPlanReport_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES public."MealPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MealPlanReport MealPlanReport_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlanReport"
    ADD CONSTRAINT "MealPlanReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MealPlan MealPlan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."MealPlan"
    ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Meal Meal_dailyMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Meal"
    ADD CONSTRAINT "Meal_dailyMenuId_fkey" FOREIGN KEY ("dailyMenuId") REFERENCES public."DailyMenu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PantryItem PantryItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."PantryItem"
    ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Progress Progress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Progress"
    ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rating Rating_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Rating_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rating Rating_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Recipe Recipe_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Recommendation Recommendation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Recommendation"
    ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedMealPlan SavedMealPlan_mealPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."SavedMealPlan"
    ADD CONSTRAINT "SavedMealPlan_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES public."MealPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedMealPlan SavedMealPlan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."SavedMealPlan"
    ADD CONSTRAINT "SavedMealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShoppingList ShoppingList_mealPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."ShoppingList"
    ADD CONSTRAINT "ShoppingList_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES public."MealPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShoppingList ShoppingList_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."ShoppingList"
    ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserConsent UserConsent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."UserConsent"
    ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserWorkflowState UserWorkflowState_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wellness_user
--

ALTER TABLE ONLY public."UserWorkflowState"
    ADD CONSTRAINT "UserWorkflowState_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: wellness_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 9TO3JZcnfRCY6AmoGm65pcGLbfn3zmLgClZFb6oQfad1N4xIqYYk0FPwZMcrnWS

