import json
import uuid

from django.contrib.auth.models import Group
from django.http import JsonResponse
from django.views import View

from arches.app.models.models import Node

from arches_rule_based_permissions.models import RuleConfig


def rule_to_dict(rule):
    return {
        "id": str(rule.id),
        "name": rule.name,
        "type": rule.type,
        "active": rule.active,
        "node_id": str(rule.node_id) if rule.node_id else None,
        "nodegroup_id": str(rule.nodegroup_id) if rule.nodegroup_id else None,
        "value": rule.value,
        "groups": [{"id": g.id, "name": g.name} for g in rule.groups.all()],
        "actions": rule.actions,
    }


class RuleConfigsView(View):
    def get(self, request):
        rules = RuleConfig.objects.prefetch_related("groups").all().order_by("name")
        return JsonResponse([rule_to_dict(r) for r in rules], safe=False)

    def post(self, request):
        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({"message": "Invalid JSON"}, status=400)

        rule_type = data.get("type", "filter_tile_has_value")
        node_id = data.get("node_id")
        nodegroup_id = data.get("nodegroup_id")

        TYPES_REQUIRING_NODE = {"filter_tile_has_value"}

        if rule_type in TYPES_REQUIRING_NODE and (not node_id or not nodegroup_id):
            return JsonResponse(
                {"message": "node_id and nodegroup_id are required"}, status=400
            )

        try:
            rule = RuleConfig(
                id=uuid.uuid4(),
                name=data.get("name", "New Rule"),
                type=rule_type,
                active=data.get("active", True),
                node_id=uuid.UUID(node_id) if node_id else None,
                nodegroup_id=uuid.UUID(nodegroup_id) if nodegroup_id else None,
                value=data.get("value") or {"value": "", "op": "eq"},
                actions=data.get("actions") or ["view_resourceinstance"],
            )
            rule.save()
            group_ids = data.get("group_ids", [])
            if group_ids:
                rule.groups.set(Group.objects.filter(id__in=group_ids))
            return JsonResponse(rule_to_dict(rule), status=201)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=400)


class RuleConfigView(View):
    def get(self, request, rule_id):
        try:
            rule = RuleConfig.objects.prefetch_related("groups").get(pk=rule_id)
            return JsonResponse(rule_to_dict(rule))
        except RuleConfig.DoesNotExist:
            return JsonResponse({"message": "Not found"}, status=404)

    def patch(self, request, rule_id):
        try:
            rule = RuleConfig.objects.prefetch_related("groups").get(pk=rule_id)
        except RuleConfig.DoesNotExist:
            return JsonResponse({"message": "Not found"}, status=404)

        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({"message": "Invalid JSON"}, status=400)

        try:
            if "name" in data:
                rule.name = data["name"]
            if "active" in data:
                rule.active = data["active"]
            if "node_id" in data and data["node_id"]:
                rule.node_id = uuid.UUID(data["node_id"])
            if "nodegroup_id" in data and data["nodegroup_id"]:
                rule.nodegroup_id = uuid.UUID(data["nodegroup_id"])
            if "value" in data:
                rule.value = data["value"]
            if "actions" in data:
                rule.actions = data["actions"]
            rule.save()

            if "group_ids" in data:
                rule.groups.set(Group.objects.filter(id__in=data["group_ids"]))

            rule.refresh_from_db()
            return JsonResponse(rule_to_dict(rule))
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=400)

    def delete(self, request, rule_id):
        try:
            RuleConfig.objects.get(pk=rule_id).delete()
            return JsonResponse({"message": "Deleted"})
        except RuleConfig.DoesNotExist:
            return JsonResponse({"message": "Not found"}, status=404)


class NodeOptionsView(View):
    def get(self, request):
        nodes = Node.objects.select_related("graph").order_by("graph__name", "name")
        result = []
        for node in nodes:
            result.append(
                {
                    "id": str(node.nodeid),
                    "name": str(node.name) if node.name else "",
                    "nodegroup_id": str(node.nodegroup_id) if node.nodegroup_id else None,
                    "graph_name": str(node.graph.name) if node.graph and node.graph.name else "",
                    "datatype": node.datatype or "",
                }
            )
        return JsonResponse(result, safe=False)


class GroupOptionsView(View):
    def get(self, request):
        groups = Group.objects.all().order_by("name")
        return JsonResponse(
            [{"id": g.id, "name": g.name} for g in groups],
            safe=False,
        )
