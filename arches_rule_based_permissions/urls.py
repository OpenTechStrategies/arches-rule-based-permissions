from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.urls import include, path

from arches_rule_based_permissions.views import (
    GroupOptionsView,
    NodeOptionsView,
    ResourceGeometriesView,
    RuleConfigsView,
    RuleConfigView,
)

urlpatterns = [
    path("api/rule_configs", RuleConfigsView.as_view(), name="rule_configs"),
    path(
        "api/rule_configs/<uuid:rule_id>",
        RuleConfigView.as_view(),
        name="rule_config",
    ),
    path("api/rule_config_nodes", NodeOptionsView.as_view(), name="rule_config_nodes"),
    path(
        "api/rule_config_groups", GroupOptionsView.as_view(), name="rule_config_groups"
    ),
    path(
        "api/rule_config_geometries",
        ResourceGeometriesView.as_view(),
        name="rule_config_geometries",
    ),
]

# Ensure Arches core urls are superseded by project-level urls
urlpatterns.append(path("", include("arches.urls")))

# Adds URL pattern to serve media files during development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Only handle i18n routing in active project. This will still handle the routes provided by Arches core and Arches applications,
# but handling i18n routes in multiple places causes application errors.
if settings.ROOT_URLCONF == __name__:
    if settings.SHOW_LANGUAGE_SWITCH is True:
        urlpatterns = i18n_patterns(*urlpatterns)

    urlpatterns.append(path("i18n/", include("django.conf.urls.i18n")))
