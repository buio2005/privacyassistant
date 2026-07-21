(function attachPrivacyJourneyEngine(globalObject) {
  const JOURNEY_VERSION = "0.8.3";
  const MAX_PRIMARY_STEPS = 4;
  const MAX_OPTIONAL_STEPS = 3;
  const MAX_DEFERRED_RECOMMENDATIONS = 6;
  const ACTIONABLE_REMEDIATION_STATUSES = new Set(["direct", "indirect", "external_tool"]);

  function translate(key, fallback, variables) {
    const i18n = globalObject.PCAI18n;
    if (i18n && typeof i18n.t === "function") {
      return i18n.t(key, fallback, variables);
    }

    return String(fallback).replace(/\{(\w+)\}/g, (_, variableName) => {
      return Object.prototype.hasOwnProperty.call(variables || {}, variableName)
        ? String(variables[variableName])
        : "";
    });
  }

  function uniqueStrings(values) {
    return Array.from(new Set((values || []).filter((value) => typeof value === "string" && value.trim().length > 0)));
  }

  function clampNumber(value, min, max) {
    if (!Number.isFinite(value)) {
      return min;
    }
    return Math.min(max, Math.max(min, value));
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function getRootCauseLabel(rootCauseId) {
    const labelMap = {
      browser_foundation_quality: translate("journey.rootCause.browserFoundation", "Qualita della base browser"),
      dns_resolver_quality: translate("journey.rootCause.dnsResolver", "Protezione DNS"),
      webrtc_exposure_control: translate("journey.rootCause.webrtcExposure", "Controllo dell'esposizione WebRTC"),
      network_tracking_preference: translate("journey.rootCause.trackingPreference", "Preferenza Do Not Track"),
      network_profile_specificity: translate("journey.rootCause.networkProfile", "Specificita del profilo di rete"),
      privacy_score_context: translate("journey.rootCause.privacyScoreContext", "Contesto del Privacy Score")
    };

    return labelMap[rootCauseId] || translate("journey.rootCause.unknown", "Causa funzionale non classificata");
  }

  function getRootCauseTemplate(rootCauseId) {
    const templateMap = {
      browser_foundation_quality: {
        title: translate("journey.template.browserFoundation.title", "Rafforza la base privacy del browser"),
        shortTitle: translate("journey.template.browserFoundation.shortTitle", "Rafforza la base browser"),
        goal: translate("journey.template.browserFoundation.goal", "Ridurre le debolezze strutturali della configurazione browser"),
        maintenanceTitle: translate("journey.template.browserFoundation.maintenance", "Mantieni la base privacy del browser")
      },
      dns_resolver_quality: {
        title: translate("journey.template.dnsResolver.title", "Rivedi prima la protezione DNS"),
        shortTitle: translate("journey.template.dnsResolver.shortTitle", "Rivedi la protezione DNS"),
        goal: translate("journey.template.dnsResolver.goal", "Migliorare la qualita del resolver DNS osservato"),
        maintenanceTitle: translate("journey.template.dnsResolver.maintenance", "Mantieni stabile la protezione DNS")
      },
      webrtc_exposure_control: {
        title: translate("journey.template.webrtcExposure.title", "Riduci prima l'esposizione WebRTC"),
        shortTitle: translate("journey.template.webrtcExposure.shortTitle", "Riduci esposizione WebRTC"),
        goal: translate("journey.template.webrtcExposure.goal", "Intervenire sulla causa attualmente dominante"),
        maintenanceTitle: translate("journey.template.webrtcExposure.maintenance", "Mantieni stabile la protezione WebRTC")
      },
      network_tracking_preference: {
        title: translate("journey.template.trackingPreference.title", "Rafforza la preferenza contro il tracciamento"),
        shortTitle: translate("journey.template.trackingPreference.shortTitle", "Rafforza la preferenza anti-tracciamento"),
        goal: translate("journey.template.trackingPreference.goal", "Ridurre la superficie di tracciamento esposta dal browser"),
        maintenanceTitle: translate("journey.template.trackingPreference.maintenance", "Mantieni attiva la preferenza anti-tracciamento")
      },
      network_profile_specificity: {
        title: translate("journey.template.networkProfile.title", "Riduci la specificita del profilo di rete"),
        shortTitle: translate("journey.template.networkProfile.shortTitle", "Riduci la specificita del profilo"),
        goal: translate("journey.template.networkProfile.goal", "Limitare i dettagli ambientali troppo specifici"),
        maintenanceTitle: translate("journey.template.networkProfile.maintenance", "Mantieni prudente il profilo di rete")
      }
    };

    return templateMap[rootCauseId] || {
      title: translate("journey.step.generic.title", "Intervieni sulla causa funzionale rilevata"),
      shortTitle: translate("journey.step.generic.shortTitle", "Intervieni sulla causa rilevata"),
      goal: translate("journey.step.generic.goal", "Ridurre la causa funzionale osservata"),
      maintenanceTitle: translate("journey.step.generic.maintenance", "Mantieni stabile la configurazione osservata")
    };
  }

  function getConfidenceLevel(overallConfidence) {
    if (overallConfidence >= 0.85) {
      return "Alta";
    }
    if (overallConfidence >= 0.65) {
      return "Media";
    }
    return "Bassa";
  }

  function buildRootCauseLookup(rootCauseState) {
    return safeArray(rootCauseState && rootCauseState.createdRootCauses).reduce((lookup, rootCause) => {
      if (rootCause && rootCause.rootCauseId) {
        lookup[rootCause.rootCauseId] = rootCause;
      }
      return lookup;
    }, {});
  }

  function getPrimaryRootCauses(rootCauseLookup) {
    return Object.values(rootCauseLookup).filter((rootCause) => rootCause && rootCause.kind === "primary");
  }

  function normalizeRecommendations(recommendationsState) {
    if (Array.isArray(recommendationsState)) {
      return recommendationsState;
    }
    return safeArray(recommendationsState && recommendationsState.recommendations);
  }

  function normalizeFutureIntegrations(recommendationsState) {
    return safeArray(recommendationsState && recommendationsState.futureIntegrations);
  }

  function mapRecommendationToRootCause(recommendation) {
    if (!recommendation) {
      return null;
    }

    const joinedText = [
      recommendation.id,
      recommendation.title,
      recommendation.description,
      recommendation.howTo,
      recommendation.audience
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (joinedText.includes("webrtc")) {
      return "webrtc_exposure_control";
    }
    if (joinedText.includes("dns") || joinedText.includes("resolver") || joinedText.includes("nextdns") || joinedText.includes("quad9")) {
      return "dns_resolver_quality";
    }
    if (joinedText.includes("do not track") || joinedText.includes("dnt")) {
      return "network_tracking_preference";
    }
    if (joinedText.includes("timezone") || joinedText.includes("language") || joinedText.includes("resolution") || joinedText.includes("fingerprint")) {
      return "network_profile_specificity";
    }
    if (
      joinedText.includes("browser")
      || joinedText.includes("chrome")
      || joinedText.includes("firefox")
      || joinedText.includes("brave")
      || joinedText.includes("edge")
      || joinedText.includes("vivaldi")
      || joinedText.includes("mullvad")
      || joinedText.includes("tor")
      || joinedText.includes("librewolf")
      || joinedText.includes("telemetry")
      || joinedText.includes("tracking")
      || joinedText.includes("sync")
      || joinedText.includes("shields")
    ) {
      return "browser_foundation_quality";
    }

    return null;
  }

  function groupRecommendationsByRootCause(recommendations) {
    return recommendations.reduce((grouped, recommendation) => {
      const rootCauseId = mapRecommendationToRootCause(recommendation);
      if (!rootCauseId) {
        return grouped;
      }

      if (!grouped[rootCauseId]) {
        grouped[rootCauseId] = [];
      }

      grouped[rootCauseId].push(recommendation);
      return grouped;
    }, {});
  }

  function getObservedRootCauseIds(rootCauses, polarity) {
    return rootCauses
      .filter((rootCause) => rootCause && rootCause.observedState && rootCause.observedState.dominantPolarity === polarity)
      .map((rootCause) => rootCause.rootCauseId);
  }

  function buildJourneyEntryContext(analysis, rootCauseState) {
    const rootCauseLookup = buildRootCauseLookup(rootCauseState);
    const primaryRootCauses = getPrimaryRootCauses(rootCauseLookup);

    return {
      overallStateKey: analysis && analysis.overallState ? analysis.overallState.key : "discreta",
      overallStateLabel: analysis && analysis.overallState ? analysis.overallState.label : "Discreta",
      overallConfidenceLevel: analysis && analysis.overallConfidence
        ? getConfidenceLevel(analysis.overallConfidence.overallConfidence || 0)
        : "Bassa",
      mainIssueSignalId: analysis && analysis.mainIssue ? analysis.mainIssue.signalId : null,
      mainIssueRootCauseId: analysis && analysis.mainIssue ? analysis.mainIssue.rootCauseId || null : null,
      priorityActionSignalId: analysis && analysis.priorityAction ? analysis.priorityAction.signalId : null,
      priorityActionRootCauseId: analysis && analysis.priorityAction ? analysis.priorityAction.rootCauseId || null : null,
      strengthRootCauseIds: uniqueStrings(safeArray(analysis && analysis.strengths).map((item) => item.rootCauseId)),
      negativeRootCauseIds: uniqueStrings(getObservedRootCauseIds(primaryRootCauses, "negative")),
      positiveRootCauseIds: uniqueStrings(getObservedRootCauseIds(primaryRootCauses, "positive")),
      neutralRootCauseIds: uniqueStrings(getObservedRootCauseIds(primaryRootCauses, "neutral"))
    };
  }

  function getProgressIntent(entryContext) {
    if (!entryContext.mainIssueRootCauseId) {
      return entryContext.positiveRootCauseIds.length > 0 ? "maintenance" : "improvement";
    }
    return "correction";
  }

  function isRootCauseActionable(rootCause, recommendations) {
    const remediation = rootCause && rootCause.observedState ? rootCause.observedState.remediation : null;
    const remediationStatus = remediation && remediation.status ? remediation.status : "not_applicable";
    return ACTIONABLE_REMEDIATION_STATUSES.has(remediationStatus) || safeArray(recommendations).length > 0;
  }

  function buildStepConfidence(rootCause, signalReference) {
    const sourceConfidence = signalReference && signalReference.confidence && typeof signalReference.confidence.overallConfidence === "number"
      ? signalReference.confidence.overallConfidence
      : 0;
    const rootCauseConfidence = rootCause && rootCause.observedState && rootCause.observedState.confidence
      ? rootCause.observedState.confidence.overallConfidence
      : 0;
    const overallConfidence = clampNumber(Math.max(sourceConfidence, rootCauseConfidence), 0, 1);

    return {
      overallConfidence,
      level: getConfidenceLevel(overallConfidence)
    };
  }

  function buildCompletionEvidence(rootCauseId) {
    const label = getRootCauseLabel(rootCauseId);
    return [
      translate("journey.completionEvidence.rootCauseNotDominant", "La causa {rootCauseLabel} non risulta piu dominante.", {
        rootCauseLabel: label
      })
    ];
  }

  function buildPrimaryStepFromSignal(rootCause, signalReference, sourceType, linkedRecommendations) {
    if (!rootCause || !rootCause.rootCauseId || !rootCause.observedState) {
      return null;
    }

    const template = getRootCauseTemplate(rootCause.rootCauseId);
    const rootCauseLabel = getRootCauseLabel(rootCause.rootCauseId);
    const remediation = rootCause.observedState.remediation || { status: "not_applicable", userControl: "none" };
    const benefitEstimate = rootCause.observedState.benefitEstimate || { status: "not_applicable", level: null };
    const signalTitle = signalReference && signalReference.title ? signalReference.title : null;
    const title = signalReference && signalReference.suggestedAction
      ? signalReference.suggestedAction
      : template.title;
    const linkedSignalIds = uniqueStrings(
      [signalReference && signalReference.signalId, rootCause.observedState.representativeSignalId]
        .concat(rootCause.observedState.contributingSignalIds || [])
    );

    return {
      id: `step_${rootCause.rootCauseId}`,
      order: 0,
      kind: "blocking",
      applicability: "applicable",
      completionState: rootCause.observedState.dominantPolarity === "negative" ? "open" : "observed_complete",
      verificationState: rootCause.observedState.dominantPolarity === "negative" ? "not_applicable" : "verified",
      rootCauseId: rootCause.rootCauseId,
      sourceType,
      sourceSignalId: signalReference ? signalReference.signalId || null : null,
      sourceRecommendationIds: safeArray(linkedRecommendations).map((item) => item.id),
      title,
      shortTitle: template.shortTitle,
      goal: template.goal,
      whyNow: translate("journey.step.whyNow", "Questa causa guida attualmente la lettura del percorso: {rootCauseLabel}.", {
        rootCauseLabel
      }),
      userEffort: remediation.userControl === "high" ? "medium" : remediation.userControl || "low",
      expectedBenefit: benefitEstimate && benefitEstimate.status === "estimated" && benefitEstimate.level
        ? benefitEstimate.level
        : "medium",
      userControl: remediation.userControl || "none",
      confidence: buildStepConfidence(rootCause, signalReference),
      linkedSignalIds,
      linkedRootCauseIds: [rootCause.rootCauseId],
      dependsOnStepIds: [],
      blocksStepIds: [],
      completionEvidence: buildCompletionEvidence(rootCause.rootCauseId),
      notes: signalTitle
        ? [translate("journey.step.sourceSignalNote", "Segnale di riferimento: {signalTitle}.", { signalTitle })]
        : []
    };
  }

  function buildMaintenanceStep(rootCause, strengthReference) {
    if (!rootCause || !rootCause.rootCauseId || !rootCause.observedState) {
      return null;
    }

    const template = getRootCauseTemplate(rootCause.rootCauseId);
    const linkedSignalIds = uniqueStrings(
      [strengthReference && strengthReference.signalId, rootCause.observedState.representativeSignalId]
        .concat(rootCause.observedState.supportingSignalIds || [])
    );

    return {
      id: `optional_${rootCause.rootCauseId}`,
      order: 0,
      kind: "maintenance",
      applicability: "applicable",
      completionState: "observed_complete",
      verificationState: "verified",
      rootCauseId: rootCause.rootCauseId,
      sourceType: "strength",
      sourceSignalId: strengthReference ? strengthReference.signalId || null : null,
      sourceRecommendationIds: [],
      title: template.maintenanceTitle,
      shortTitle: template.maintenanceTitle,
      goal: translate("journey.step.maintenanceGoal", "Mantenere stabile una condizione gia favorevole"),
      whyNow: translate("journey.step.maintenanceWhyNow", "Questa Root Cause appare gia positiva e non deve essere indebolita."),
      userEffort: "low",
      expectedBenefit: "medium",
      userControl: "medium",
      confidence: buildStepConfidence(rootCause, strengthReference),
      linkedSignalIds,
      linkedRootCauseIds: [rootCause.rootCauseId],
      dependsOnStepIds: [],
      blocksStepIds: [],
      completionEvidence: buildCompletionEvidence(rootCause.rootCauseId),
      notes: []
    };
  }

  function buildDeferredRecommendationItem(recommendation, reason) {
    return {
      id: recommendation.id,
      title: recommendation.title,
      rootCauseId: mapRecommendationToRootCause(recommendation),
      reason,
      recommendationRef: recommendation.id,
      applicability: "applicable"
    };
  }

  function buildNonApplicableStep(rootCauseId, title, exclusionReason) {
    return {
      id: `non_applicable_${rootCauseId}`,
      title,
      rootCauseId,
      exclusionReason,
      applicability: "not_applicable",
      blockedBy: []
    };
  }

  function scoreCandidateStep(step, entryContext) {
    if (!step) {
      return -Infinity;
    }

    let score = step.kind === "blocking" ? 10 : 3;
    if (step.rootCauseId && step.rootCauseId === entryContext.priorityActionRootCauseId) {
      score += 6;
    }
    if (step.rootCauseId && step.rootCauseId === entryContext.mainIssueRootCauseId) {
      score += 4;
    }
    if (step.expectedBenefit === "high") {
      score += 2;
    } else if (step.expectedBenefit === "medium") {
      score += 1;
    }

    score += step.confidence && typeof step.confidence.overallConfidence === "number"
      ? step.confidence.overallConfidence
      : 0;

    return score;
  }

  function normalizeStepOrdering(steps) {
    return safeArray(steps).map((step, index) => Object.assign({}, step, { order: index + 1 }));
  }

  function buildCandidateSteps(context) {
    const candidates = [];
    const analysis = context.analysis;
    const rootCauseLookup = context.rootCauseLookup;
    const recommendationGroups = context.recommendationGroups;

    if (analysis && analysis.priorityAction && analysis.priorityAction.rootCauseId) {
      const primaryRootCause = rootCauseLookup[analysis.priorityAction.rootCauseId];
      const primaryRecommendations = safeArray(recommendationGroups[analysis.priorityAction.rootCauseId]).slice(0, 2);
      if (primaryRootCause && primaryRootCause.observedState && primaryRootCause.observedState.dominantPolarity === "negative") {
        candidates.push({
          candidateType: "primary",
          rootCauseId: primaryRootCause.rootCauseId,
          step: buildPrimaryStepFromSignal(primaryRootCause, analysis.priorityAction, "priorityAction", primaryRecommendations)
        });
      }
    }

    entryLoop:
    for (const rootCauseId of context.entryContext.negativeRootCauseIds) {
      if (analysis && analysis.priorityAction && analysis.priorityAction.rootCauseId === rootCauseId) {
        continue entryLoop;
      }

      const rootCause = rootCauseLookup[rootCauseId];
      if (!rootCause || !rootCause.observedState) {
        continue entryLoop;
      }

      const linkedRecommendations = safeArray(recommendationGroups[rootCauseId]).slice(0, 2);
      if (!isRootCauseActionable(rootCause, linkedRecommendations)) {
        candidates.push({
          candidateType: "non_applicable",
          rootCauseId,
          step: buildNonApplicableStep(
            rootCauseId,
            getRootCauseTemplate(rootCauseId).title,
            translate("journey.nonApplicable.noActionablePath", "Nella prima implementazione non esiste ancora un'azione osservabile e affidabile per questa causa.")
          )
        });
        continue entryLoop;
      }

      const representativeSignal = rootCause.observedState.representativeSignalId
        ? { signalId: rootCause.observedState.representativeSignalId, title: getRootCauseLabel(rootCauseId) }
        : null;
      candidates.push({
        candidateType: "primary",
        rootCauseId,
        step: buildPrimaryStepFromSignal(rootCause, representativeSignal, "rootCause", linkedRecommendations)
      });
    }

    for (const strength of safeArray(analysis && analysis.strengths)) {
      if (!strength || !strength.rootCauseId) {
        continue;
      }
      const rootCause = rootCauseLookup[strength.rootCauseId];
      if (!rootCause || !rootCause.observedState || rootCause.observedState.dominantPolarity !== "positive") {
        continue;
      }
      candidates.push({
        candidateType: "optional",
        rootCauseId: rootCause.rootCauseId,
        step: buildMaintenanceStep(rootCause, strength)
      });
    }

    return candidates;
  }

  function classifyJourneyCandidates(context, candidateSteps) {
    const usedRecommendationIds = new Set();
    const seenPrimaryRootCauses = new Set();
    const seenOptionalRootCauses = new Set();

    const primarySteps = normalizeStepOrdering(
      candidateSteps
        .filter((entry) => entry.candidateType === "primary" && entry.step)
        .sort((left, right) => scoreCandidateStep(right.step, context.entryContext) - scoreCandidateStep(left.step, context.entryContext))
        .filter((entry) => {
          if (seenPrimaryRootCauses.has(entry.rootCauseId)) {
            return false;
          }
          seenPrimaryRootCauses.add(entry.rootCauseId);
          return true;
        })
        .slice(0, MAX_PRIMARY_STEPS)
        .map((entry) => {
          safeArray(entry.step.sourceRecommendationIds).forEach((recommendationId) => usedRecommendationIds.add(recommendationId));
          return entry.step;
        })
    );

    const optionalSteps = normalizeStepOrdering(
      candidateSteps
        .filter((entry) => entry.candidateType === "optional" && entry.step)
        .filter((entry) => {
          if (seenOptionalRootCauses.has(entry.rootCauseId)) {
            return false;
          }
          seenOptionalRootCauses.add(entry.rootCauseId);
          return true;
        })
        .slice(0, MAX_OPTIONAL_STEPS)
        .map((entry) => entry.step)
    );

    const nonApplicableSteps = candidateSteps
      .filter((entry) => entry.candidateType === "non_applicable" && entry.step)
      .map((entry) => entry.step);

    const deferredRecommendations = context.recommendations
      .filter((recommendation) => !usedRecommendationIds.has(recommendation.id))
      .slice(0, MAX_DEFERRED_RECOMMENDATIONS)
      .map((recommendation) => {
        return buildDeferredRecommendationItem(
          recommendation,
          translate("journey.deferredRecommendation.reason", "Suggerimento valido ma non prioritario rispetto al percorso principale.")
        );
      });

    return {
      steps: primarySteps,
      optionalSteps,
      deferredRecommendations,
      nonApplicableSteps
    };
  }

  function deriveVerificationStatus(steps) {
    const primarySteps = safeArray(steps);
    if (primarySteps.length === 0) {
      return "not_applicable";
    }
    if (primarySteps.every((step) => step.verificationState === "verified")) {
      return "verified";
    }
    if (primarySteps.some((step) => step.verificationState === "not_verifiable")) {
      return "not_available";
    }
    return "not_applicable";
  }

  function deriveJourneyState(context, classifiedSteps) {
    const totalPrimarySteps = safeArray(classifiedSteps.steps).length;
    const observedCompletedPrimarySteps = safeArray(classifiedSteps.steps)
      .filter((step) => step.completionState === "observed_complete")
      .length;
    const progressRatio = totalPrimarySteps > 0
      ? clampNumber(observedCompletedPrimarySteps / totalPrimarySteps, 0, 1)
      : context.entryContext.mainIssueRootCauseId
        ? 0
        : classifiedSteps.optionalSteps.some((step) => step.completionState === "observed_complete")
          ? 1
          : 0;
    const verificationStatus = deriveVerificationStatus(classifiedSteps.steps);
    let key = "ready_to_start";
    let label = "Pronto a iniziare";

    if (totalPrimarySteps === 0 && !context.entryContext.mainIssueRootCauseId) {
      if (classifiedSteps.optionalSteps.some((step) => step.completionState === "observed_complete")) {
        key = "stabilized";
        label = "Stabilizzato";
      } else {
        key = "not_needed";
        label = "Non necessario";
      }
    } else if (observedCompletedPrimarySteps === 0) {
      key = "ready_to_start";
      label = "Pronto a iniziare";
    } else if (observedCompletedPrimarySteps < totalPrimarySteps) {
      key = "in_progress";
      label = "In corso";
    } else {
      key = "stabilized";
      label = "Stabilizzato";
    }

    return {
      key,
      label,
      progressIntent: getProgressIntent(context.entryContext),
      progressRatio,
      observedCompletedPrimarySteps,
      totalPrimarySteps,
      verificationStatus,
      maxVisibleSteps: MAX_PRIMARY_STEPS
    };
  }

  function buildJourneyReasoning(context, classifiedSteps, journeyState) {
    const mainEntryLabel = context.entryContext.mainIssueRootCauseId
      ? getRootCauseLabel(context.entryContext.mainIssueRootCauseId)
      : translate("journey.common.noDominantCause", "nessuna causa dominante");

    return {
      journeyEntryReason: context.entryContext.mainIssueRootCauseId
        ? translate("journey.reasoning.entry.rootCause", "Il percorso parte dalla Root Cause dominante {rootCauseLabel} individuata dalla 0.8.2.", {
          rootCauseLabel: mainEntryLabel
        })
        : translate("journey.reasoning.entry.none", "Non emerge una mainIssue abbastanza forte da aprire un percorso correttivo principale."),
      orderingReason: translate("journey.reasoning.ordering", "Gli step sono ordinati per priorita della causa dominante, beneficio atteso e controllabilita osservabile."),
      exclusionReason: safeArray(classifiedSteps.nonApplicableSteps).length > 0
        ? translate("journey.reasoning.exclusion.nonApplicable", "Alcune azioni plausibili restano fuori dal percorso principale perche non ancora applicabili o non abbastanza osservabili.")
        : translate("journey.reasoning.exclusion.none", "Le azioni secondarie o non prioritarie restano fuori dal percorso principale e possono comparire come suggerimenti differiti."),
      verificationReason: journeyState.verificationStatus === "verified"
        ? translate("journey.reasoning.verification.verified", "Il sistema mostra solo verifiche osservabili e non assume completamenti non confermati.")
        : translate("journey.reasoning.verification.limited", "Il sistema non introduce stati artificiali di completamento: il progresso viene derivato solo da evidenze osservabili.")
    };
  }

  function buildJourneyDiagnostics(context, classifiedSteps) {
    return {
      availableRecommendationCount: context.recommendations.length,
      selectedPrimaryStepCount: safeArray(classifiedSteps.steps).length,
      optionalStepCount: safeArray(classifiedSteps.optionalSteps).length,
      deferredRecommendationCount: safeArray(classifiedSteps.deferredRecommendations).length,
      nonApplicableStepCount: safeArray(classifiedSteps.nonApplicableSteps).length,
      warnings: []
    };
  }

  function validateJourneyInput(input) {
    const errors = [];

    if (!input || typeof input !== "object") {
      errors.push("Journey input mancante o non valido.");
    }

    if (!input || !input.analysis || typeof input.analysis !== "object") {
      errors.push("Analysis mancante.");
    }

    if (!input || !input.rootCauses || typeof input.rootCauses !== "object") {
      errors.push("Root causes mancanti.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function buildEmptyJourney(context, statusKey) {
    const hasMainIssue = Boolean(context.entryContext.mainIssueRootCauseId);
    const journeyState = {
      key: hasMainIssue ? "ready_to_start" : "not_needed",
      label: hasMainIssue ? "Pronto a iniziare" : "Non necessario",
      progressIntent: getProgressIntent(context.entryContext),
      progressRatio: 0,
      observedCompletedPrimarySteps: 0,
      totalPrimarySteps: 0,
      verificationStatus: "not_applicable",
      maxVisibleSteps: MAX_PRIMARY_STEPS
    };

    return {
      version: JOURNEY_VERSION,
      basedOnAnalysisVersion: "0.8.2",
      createdAt: new Date().toISOString(),
      status: statusKey,
      entryContext: context.entryContext,
      journeyState,
      steps: [],
      optionalSteps: [],
      deferredRecommendations: [],
      nonApplicableSteps: [],
      reasoning: buildJourneyReasoning(context, {
        steps: [],
        optionalSteps: [],
        deferredRecommendations: [],
        nonApplicableSteps: []
      }, journeyState),
      diagnostics: {
        availableRecommendationCount: context.recommendations.length,
        selectedPrimaryStepCount: 0,
        optionalStepCount: 0,
        deferredRecommendationCount: 0,
        nonApplicableStepCount: 0,
        warnings: statusKey === "degraded"
          ? [translate("journey.diagnostics.degraded", "Il Journey e stato costruito in modalita degradata per mancanza di dipendenze complete.")]
          : []
      }
    };
  }

  function buildPrivacyJourney(input) {
    const inputValidation = validateJourneyInput(input);
    const analysis = input && input.analysis ? input.analysis : {};
    const rootCauses = input && input.rootCauses ? input.rootCauses : {};
    const recommendations = normalizeRecommendations(input && input.recommendations);
    const rootCauseLookup = buildRootCauseLookup(rootCauses);
    const entryContext = buildJourneyEntryContext(analysis, rootCauses);
    const context = {
      analysis,
      rootCauses,
      rootCauseLookup,
      recommendations,
      recommendationGroups: groupRecommendationsByRootCause(recommendations),
      entryContext
    };

    if (!inputValidation.valid) {
      return buildEmptyJourney(context, "degraded");
    }

    const candidateSteps = buildCandidateSteps(context);
    const classifiedSteps = classifyJourneyCandidates(context, candidateSteps);
    const journeyState = deriveJourneyState(context, classifiedSteps);
    const journey = {
      version: JOURNEY_VERSION,
      basedOnAnalysisVersion: "0.8.2",
      createdAt: new Date().toISOString(),
      status: journeyState.key === "not_needed" && classifiedSteps.steps.length === 0 ? "empty" : "ready",
      entryContext,
      journeyState,
      steps: classifiedSteps.steps,
      optionalSteps: classifiedSteps.optionalSteps,
      deferredRecommendations: classifiedSteps.deferredRecommendations,
      nonApplicableSteps: classifiedSteps.nonApplicableSteps,
      reasoning: buildJourneyReasoning(context, classifiedSteps, journeyState),
      diagnostics: buildJourneyDiagnostics(context, classifiedSteps)
    };

    return journey;
  }

  function validatePrivacyJourney(journey) {
    const errors = [];
    const warnings = [];

    if (!journey || typeof journey !== "object") {
      return {
        valid: false,
        errors: ["Journey runtime mancante o non valido."],
        warnings: [],
        stepCount: 0
      };
    }

    if (journey.version !== JOURNEY_VERSION) {
      warnings.push("Versione del Journey diversa da quella attesa.");
    }

    if (!journey.entryContext || typeof journey.entryContext !== "object") {
      errors.push("entryContext mancante.");
    }

    if (!journey.journeyState || typeof journey.journeyState !== "object") {
      errors.push("journeyState mancante.");
    } else {
      if (!["not_needed", "ready_to_start", "in_progress", "stabilized", "awaiting_verification"].includes(journey.journeyState.key)) {
        errors.push("journeyState.key non valido.");
      }
      if (journey.journeyState.observedCompletedPrimarySteps > journey.journeyState.totalPrimarySteps) {
        errors.push("observedCompletedPrimarySteps non puo superare totalPrimarySteps.");
      }
      if (!Number.isFinite(journey.journeyState.progressRatio) || journey.journeyState.progressRatio < 0 || journey.journeyState.progressRatio > 1) {
        errors.push("progressRatio deve essere compreso tra 0 e 1.");
      }
    }

    const steps = safeArray(journey.steps);
    const optionalSteps = safeArray(journey.optionalSteps);
    const deferredRecommendations = safeArray(journey.deferredRecommendations);
    const nonApplicableSteps = safeArray(journey.nonApplicableSteps);

    if (steps.length > MAX_PRIMARY_STEPS) {
      errors.push("Il percorso principale supera il massimo consentito di step.");
    }

    steps.forEach((step, index) => {
      if (!step || typeof step !== "object") {
        errors.push(`Step primario non valido in posizione ${index + 1}.`);
        return;
      }

      if (step.order !== index + 1) {
        warnings.push(`Lo step ${step.id || index + 1} non ha un ordine coerente con la posizione attesa.`);
      }

      if (!["blocking", "optional", "maintenance"].includes(step.kind)) {
        errors.push(`kind non valido per lo step ${step.id || index + 1}.`);
      }

      if (!["applicable", "conditionally_applicable", "not_applicable"].includes(step.applicability)) {
        errors.push(`applicability non valida per lo step ${step.id || index + 1}.`);
      }

      if (!["open", "observed_complete"].includes(step.completionState)) {
        errors.push(`completionState non valido per lo step ${step.id || index + 1}.`);
      }

      if (!["not_applicable", "verified", "not_verifiable"].includes(step.verificationState)) {
        errors.push(`verificationState non valido per lo step ${step.id || index + 1}.`);
      }
    });

    optionalSteps.forEach((step, index) => {
      if (!step || typeof step !== "object") {
        errors.push(`Optional step non valido in posizione ${index + 1}.`);
      }
    });

    deferredRecommendations.forEach((recommendation, index) => {
      if (!recommendation || typeof recommendation !== "object" || !recommendation.id) {
        errors.push(`Deferred recommendation non valida in posizione ${index + 1}.`);
      }
    });

    nonApplicableSteps.forEach((step, index) => {
      if (!step || typeof step !== "object" || step.applicability !== "not_applicable") {
        errors.push(`Non applicable step non valido in posizione ${index + 1}.`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stepCount: steps.length,
      optionalStepCount: optionalSteps.length,
      deferredRecommendationCount: deferredRecommendations.length,
      nonApplicableStepCount: nonApplicableSteps.length
    };
  }

  function summarizeJourneyState(journey) {
    if (!journey || !journey.journeyState) {
      return {
        key: "not_needed",
        label: "Non necessario",
        progressRatio: 0
      };
    }

    return {
      key: journey.journeyState.key,
      label: journey.journeyState.label,
      progressRatio: journey.journeyState.progressRatio
    };
  }

  globalObject.PrivacyJourneyEngine = {
    JOURNEY_VERSION,
    buildPrivacyJourney,
    validatePrivacyJourney,
    summarizeJourneyState
  };
})(window);
