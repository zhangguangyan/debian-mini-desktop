1. Total Request Rate
Query: rate(http_server_duration_milliseconds_count[5m])
Description: Shows the average number of requests processed per second over the last 5 minutes.
Purpose: To monitor the overall load on your server.
2. Average Request Duration
Query: rate(http_server_duration_milliseconds_sum[5m]) / rate(http_server_duration_milliseconds_count[5m])
Description: Calculates the average duration of requests over the last 5 minutes.
Purpose: To monitor the performance and response time of your server.
3. Request Duration Percentiles (e.g., 50th, 90th, 95th, 99th)
Query:
promql
Copy code
histogram_quantile(0.95, sum(rate(http_server_duration_milliseconds_bucket[5m])) by (le))
Description: Shows the 95th percentile of request durations over the last 5 minutes.
Purpose: To understand the distribution of response times and identify performance outliers.
4. Histogram of Request Durations
Query:
promql
Copy code
sum(rate(http_server_duration_milliseconds_bucket[5m])) by (le)
Description: Visualizes the distribution of request durations over the last 5 minutes.
Purpose: To analyze how many requests fall into different duration buckets.
5. Total Request Count Over Time
Query:
promql
Copy code
increase(http_server_duration_milliseconds_count[1h])
Description: Shows the total number of requests processed in the last hour.
Purpose: To track the total workload over a longer period.
6. Error Rate (Assuming HTTP Status Code Other Than 200)
Query:
promql
Copy code
rate(http_server_duration_milliseconds_count{http_status_code!="200"}[5m])
Description: Shows the rate of error responses per second over the last 5 minutes.
Purpose: To monitor the error rate and ensure the reliability of your server.
7. Request Rate by HTTP Status Code
Query:
promql
Copy code
sum(rate(http_server_duration_milliseconds_count[5m])) by (http_status_code)
Description: Breaks down the request rate by HTTP status code.
Purpose: To identify the distribution of response status codes and detect issues.
8. Latency Heatmap
Query:
promql
Copy code
sum(rate(http_server_duration_milliseconds_bucket[5m])) by (le)
Description: Creates a heatmap of request durations to visualize latency over time.
Purpose: To detect latency trends and potential performance degradation.
9. Total Processing Time
Query:
promql
Copy code
increase(http_server_duration_milliseconds_sum[1h])
Description: Shows the total processing time spent on requests in the last hour.
Purpose: To analyze how much time is being spent handling requests.
10. Request Rate by Path or Endpoint (Assuming Path Label is Available)
Query:
promql
Copy code
sum(rate(http_server_duration_milliseconds_count[5m])) by (path)
Description: Breaks down the request rate by the request path or endpoint.
Purpose: To understand the load on different endpoints and optimize performance.
