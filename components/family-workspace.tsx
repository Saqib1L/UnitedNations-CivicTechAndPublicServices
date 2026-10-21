"use client";

import { ArrowRight, Check, Clock3 } from "lucide-react";
import { dateLabel, stages, type CaseDetail, type Estate } from "@/lib/api";
import { Badge, Button } from "./ui";

type Translator = (value: string) => string;

export function FamilyHome({
  estates,
  intakes,
  openCase,
  onIntake,
  t,
}: {
  estates: Estate[];
  intakes: any[];
  openCase: (id: number, section?: string) => void;
  onIntake: (intake: any) => void;
  t: Translator;
}) {
  return (
    <div className="family-home">
      {estates.map((estate) => (
        <section className="panel family-case" key={estate.id}>
          <div className="family-case-heading">
            <div>
              <p className="case-reference">{estate.reference}</p>
              <h2>{estate.deceased}</h2>
            </div>
            <Badge tone={estate.stage === 6 ? "green" : "blue"}>
              {t(estate.stage === 6 ? "Completed" : stages[estate.stage])}
            </Badge>
          </div>
          <p>
            {estate.tasks_count > 0
              ? `${estate.tasks_count} ${t(estate.tasks_count === 1 ? "task in progress." : "tasks in progress.")}`
              : estate.stage === 6
                ? t("All assets have been released or registered.")
                : t(
                    "No action needed from you right now. Your lawyer will update you here.",
                  )}
          </p>
          <Button
            aria-label={`${estate.deceased} ${estate.reference}`}
            onClick={() => openCase(estate.id)}
          >
            {t("View estate")} <ArrowRight size={17} />
          </Button>
        </section>
      ))}
      {intakes.length > 0 && (
        <section className="panel simple-section">
          <h2>{t("Your enquiries")}</h2>
          {intakes.map((intake) => (
            <div className="enquiry-summary" key={intake.id}>
              <div>
                <h3>{intake.data.deceased || t("Draft estate enquiry")}</h3>
                <p>
                  {intake.response ||
                    (intake.status === "draft"
                      ? t("Saved. You can finish this later.")
                      : intake.status === "accepted"
                        ? t("Your lawyer has opened the estate case.")
                        : t("Waiting for the law firm to respond."))}
                </p>
              </div>
              {["draft", "information_requested"].includes(intake.status) ? (
                <Button kind="secondary" onClick={() => onIntake(intake)}>
                  {t("Continue enquiry")}
                </Button>
              ) : intake.estate_id &&
                !estates.some((estate) => estate.id === intake.estate_id) ? (
                <Button
                  kind="secondary"
                  onClick={() => openCase(intake.estate_id)}
                >
                  {t("View estate")}
                </Button>
              ) : (
                <span className="muted">
                  {intake.status.replaceAll("_", " ")}
                </span>
              )}
            </div>
          ))}
        </section>
      )}
      {!estates.length && !intakes.length && (
        <section className="panel simple-section getting-started">
          <h2>{t("Get help with an estate")}</h2>
          <p>
            {t(
              "Tell us what you know. A lawyer will review your enquiry and explain the next steps.",
            )}
          </p>
          <Button onClick={() => onIntake({ data: {}, status: "draft" })}>
            {t("Start an enquiry")} <ArrowRight size={17} />
          </Button>
        </section>
      )}
      {(estates.length > 0 || intakes.length > 0) && (
        <button
          className="text-link"
          onClick={() => onIntake({ data: {}, status: "draft" })}
        >
          {t("Get help with another estate")} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

export function FamilyCaseOverview({
  detail,
  userId,
  onSection,
  onEdit,
  t,
}: {
  detail: CaseDetail;
  userId: number;
  onSection: (section: string) => void;
  onEdit: () => void;
  t: Translator;
}) {
  const tasks = detail.records.task || [];
  const outstanding = tasks.filter(
    (task) => task.owner_id === userId && task.data.status === "open",
  );
  const awaitingReview = tasks.some((task) => task.data.status === "responded");
  const assets = detail.records.asset || [];
  const released = assets.filter(
    (asset) => asset.data.status === "released",
  ).length;
  const stage = detail.estate.stage;
  const hearing = detail.records.hearing?.[0];
  const nextTask = outstanding[0];
  const nextActor = nextTask
    ? t("You")
    : stage === 6
      ? t("No further action")
      : stage === 3 && !awaitingReview
        ? t("Processing office (demo)")
        : detail.lawyer.name;
  const latest = detail.records.activity?.[0];
  return (
    <div className="family-overview">
      <section className="next-step" aria-labelledby="next-step-title">
        <div className="next-step-label">{t("What happens next")}</div>
        <h2 id="next-step-title">
          {nextTask
            ? nextTask.data.title
            : stage === 6
              ? t("This estate is complete")
              : awaitingReview
                ? t("Your lawyer is reviewing your response")
                : t("No action needed from you right now")}
        </h2>
        <p>
          {nextTask
            ? nextTask.data.description
            : stage === 6
              ? t("All assets have been released or registered.")
              : stage === 3
                ? t(
                    "The application is with the processing office. Any requests will appear here.",
                  )
                : t(
                    "Your lawyer is handling the next step. Any requests will appear here.",
                  )}
        </p>
        <p className="next-owner">
          {t("Next to act")}: <strong>{nextActor}</strong>
        </p>
        {nextTask && (
          <Button onClick={() => onSection("My tasks")}>
            {t("View request")} <ArrowRight size={17} />
          </Button>
        )}
      </section>
      {hearing && (
        <section className="appointment-strip">
          <Clock3 size={20} />
          <div>
            <h2>{t("Your next appointment")}</h2>
            <p>
              {dateLabel(hearing.data.date)} · {hearing.data.location}
            </p>
          </div>
        </section>
      )}
      <section
        className="simple-section"
        aria-labelledby="estate-progress-title"
      >
        <h2 id="estate-progress-title">{t("Estate progress")}</h2>
        <p>
          {stage === 6
            ? t("Completed")
            : `${t("Current stage")}: ${t(stages[stage])}`}
        </p>
        <p>
          {released} {t("of")} {assets.length}{" "}
          {t("assets released or registered")}.{" "}
          {stage >= 4 && released < assets.length
            ? t("The order is issued. Asset claims still need to be completed.")
            : ""}
        </p>
        <button className="text-link" onClick={() => onSection("Assets")}>
          {t("View assets")} <ArrowRight size={16} />
        </button>
        <details className="plain-details">
          <summary>{t("See all process stages")}</summary>
          <ol className="stage-list">
            {stages.map((label, index) => (
              <li
                key={label}
                aria-current={stage === index ? "step" : undefined}
              >
                <span className="stage-number">
                  {index < stage ? <Check size={16} /> : index + 1}
                </span>
                <span>
                  {t(label)}
                  {index === stage && <strong> · {t("Current stage")}</strong>}
                </span>
              </li>
            ))}
          </ol>
        </details>
      </section>
      <section className="simple-section">
        <h2>{t("Latest update")}</h2>
        {latest ? (
          <>
            <h3>{latest.data.title}</h3>
            <p>{latest.data.detail}</p>
            <p className="update-meta">
              {latest.data.actor} · {dateLabel(latest.created)}
            </p>
          </>
        ) : (
          <p>{t("Updates from your lawyer will appear here.")}</p>
        )}
        <button className="text-link" onClick={() => onSection("Updates")}>
          {t("View all updates")} <ArrowRight size={16} />
        </button>
      </section>
      <details className="plain-details estate-details">
        <summary>{t("Estate and family details")}</summary>
        <dl className="summary-list">
          <div>
            <dt>{t("Lawyer")}</dt>
            <dd>
              {detail.lawyer.name} · {detail.lawyer.organisation}
            </dd>
          </div>
          <div>
            <dt>{t("Jurisdiction")}</dt>
            <dd>{detail.estate.jurisdiction}</dd>
          </div>
          <div>
            <dt>{t("Circumstances")}</dt>
            <dd>{detail.estate.details.story || t("Not recorded yet")}</dd>
          </div>
          {detail.estate.details.family && (
            <div>
              <dt>{t("Family")}</dt>
              <dd>{detail.estate.details.family}</dd>
            </div>
          )}
        </dl>
        <a
          className="text-link"
          href={`/api/cases/${detail.estate.id}/summary`}
        >
          {t("Download summary")}
        </a>
        {detail.is_coordinator && (
          <button className="text-link" onClick={onEdit}>
            {t("Update family information")}
          </button>
        )}
      </details>
    </div>
  );
}
