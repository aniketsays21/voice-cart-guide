import os
import json
from dotenv import load_dotenv
import streamlit as st
import google.generativeai as genai
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    DateRange,
    Dimension,
    Metric,
    OrderBy,
    FilterExpression,
    Filter,
    NumericValue,
)
from google.oauth2 import service_account

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GA4_PROPERTY_ID = os.getenv("GA4_PROPERTY_ID")
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), "service-account-key.json")

genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-1.5-flash")

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=["https://www.googleapis.com/auth/analytics.readonly"],
)
ga4_client = BetaAnalyticsDataClient(credentials=credentials)

SYSTEM_PROMPT = """You are a GA4 analytics query translator. Convert natural language questions into GA4 API parameters.

Return ONLY a valid JSON object with these fields:
{
  "date_range": {"start_date": "YYYY-MM-DD or NdaysAgo", "end_date": "today"},
  "dimensions": ["list of GA4 dimension names"],
  "metrics": ["list of GA4 metric names"],
  "limit": number,
  "order_by_metric": "metric name to sort by (optional)",
  "order_desc": true
}

Common GA4 dimensions: date, city, country, deviceCategory, sessionSource, sessionMedium, pagePath, eventName, platform
Common GA4 metrics: activeUsers, sessions, screenPageViews, bounceRate, averageSessionDuration, eventCount, newUsers, totalUsers

Examples:
- "last 24 users" → activeUsers with 1daysAgo, limit 24
- "top 10 cities by sessions today" → city dimension, sessions metric, limit 10
- "traffic sources this week" → sessionSource dimension, sessions metric, 7daysAgo
- "page views last 30 days" → pagePath dimension, screenPageViews metric, 30daysAgo
"""


def parse_query_with_gemini(user_query: str) -> dict:
    response = gemini.generate_content(
        f"{SYSTEM_PROMPT}\n\nUser query: {user_query}\n\nReturn only JSON:"
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def run_ga4_report(params: dict) -> list[dict]:
    dimensions = [Dimension(name=d) for d in params.get("dimensions", ["date"])]
    metrics = [Metric(name=m) for m in params.get("metrics", ["activeUsers"])]

    date_range = params.get("date_range", {})
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        dimensions=dimensions,
        metrics=metrics,
        date_ranges=[
            DateRange(
                start_date=date_range.get("start_date", "7daysAgo"),
                end_date=date_range.get("end_date", "today"),
            )
        ],
        limit=params.get("limit", 50),
    )

    if params.get("order_by_metric"):
        request.order_bys = [
            OrderBy(
                metric=OrderBy.MetricOrderBy(metric_name=params["order_by_metric"]),
                desc=params.get("order_desc", True),
            )
        ]

    response = ga4_client.run_report(request)

    dim_headers = [h.name for h in response.dimension_headers]
    met_headers = [h.name for h in response.metric_headers]

    results = []
    for row in response.rows:
        record = {}
        for i, val in enumerate(row.dimension_values):
            record[dim_headers[i]] = val.value
        for i, val in enumerate(row.metric_values):
            record[met_headers[i]] = val.value
        results.append(record)

    return results


def summarize_with_gemini(user_query: str, data: list[dict]) -> str:
    data_str = json.dumps(data[:50], indent=2)
    prompt = f"""The user asked: "{user_query}"

Here is the GA4 data retrieved:
{data_str}

Give a clear, concise summary of this data answering the user's question. Use bullet points where helpful. Include key numbers."""

    response = gemini.generate_content(prompt)
    return response.text


# ── Streamlit UI ──────────────────────────────────────────────────────────────

st.set_page_config(page_title="Rubans GA4 Analytics Assistant", page_icon="📊", layout="wide")

st.title("📊 Rubans Analytics Assistant")
st.caption(f"Connected to GA4 Property: {GA4_PROPERTY_ID}")

if "history" not in st.session_state:
    st.session_state.history = []

with st.form("query_form", clear_on_submit=True):
    user_input = st.text_input(
        "Ask a question about your analytics:",
        placeholder='e.g. "give me last 24 users", "top cities this week", "page views today"',
    )
    submitted = st.form_submit_button("Ask", use_container_width=True)

if submitted and user_input.strip():
    with st.spinner("Fetching data from GA4..."):
        try:
            params = parse_query_with_gemini(user_input)
            data = run_ga4_report(params)
            summary = summarize_with_gemini(user_input, data)

            st.session_state.history.append({
                "query": user_input,
                "params": params,
                "data": data,
                "summary": summary,
            })
        except Exception as e:
            st.error(f"Error: {e}")

for item in reversed(st.session_state.history):
    st.divider()
    st.markdown(f"**You:** {item['query']}")
    st.markdown(f"**Assistant:**\n\n{item['summary']}")

    with st.expander("View raw data table"):
        if item["data"]:
            st.dataframe(item["data"], use_container_width=True)
        else:
            st.info("No data returned.")

    with st.expander("View GA4 query params"):
        st.json(item["params"])
