{{/*
Expand the name of the chart.
*/}}
{{- define "_TEMPLATE_-backend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "_TEMPLATE_-backend.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "_TEMPLATE_-backend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "_TEMPLATE_-backend.labels" -}}
helm.sh/chart: {{ include "_TEMPLATE_-backend.chart" . }}
{{ include "_TEMPLATE_-backend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "_TEMPLATE_-backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "_TEMPLATE_-backend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "_TEMPLATE_-backend.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "_TEMPLATE_-backend.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Worker section
*/}}
{{- define "_TEMPLATE_-worker.fullname" -}}
_TEMPLATE_-worker
{{- end }}
{{- define "_TEMPLATE_-worker.labels" -}}
helm.sh/chart: {{ include "_TEMPLATE_-backend.chart" . }}
{{ include "_TEMPLATE_-worker.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "_TEMPLATE_-worker.selectorLabels" -}}
app.kubernetes.io/name: {{ include "_TEMPLATE_-backend.name" . }}-worker
app.kubernetes.io/instance: {{ .Release.Name }}-worker

component: worker
{{- end }}
{{- define "_TEMPLATE_-worker.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "_TEMPLATE_-worker.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Cron section
*/}}
{{- define "_TEMPLATE_-cron.fullname" -}}
_TEMPLATE_-cron
{{- end }}
{{- define "_TEMPLATE_-cron.labels" -}}
helm.sh/chart: {{ include "_TEMPLATE_-backend.chart" . }}
{{ include "_TEMPLATE_-cron.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "_TEMPLATE_-cron.selectorLabels" -}}
app.kubernetes.io/name: {{ include "_TEMPLATE_-backend.name" . }}-cron
app.kubernetes.io/instance: {{ .Release.Name }}-cron

component: cron
{{- end }}
{{- define "_TEMPLATE_-cron.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "_TEMPLATE_-cron.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
